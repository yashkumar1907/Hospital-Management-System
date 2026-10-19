const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const path = require("node:path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const sourceMongoUri = process.env.MONGO_URI;
if (!sourceMongoUri) {
    throw new Error("Integration tests require MONGO_URI in BACKEND/.env.");
}

const sourceMongoUrl = new URL(sourceMongoUri);
const sourceDatabase = decodeURIComponent(sourceMongoUrl.pathname.replace(/^\//, ""));
if (sourceDatabase === "hms_codex_test") {
    throw new Error("The configured URI already targets the reserved integration database.");
}

const testDatabase = `hms_codex_test_${Date.now()}`;
sourceMongoUrl.pathname = `/${testDatabase}`;
process.env.MONGO_URI = sourceMongoUrl.toString();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const generateToken = require("../utils/generateToken");
const Admin = require("../models/Admin");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const DoctorSlot = require("../models/DoctorSlot");
const ContactMessage = require("../models/ContactMessage");

let server;
let baseUrl;
let adminToken;
let doctorToken;
let otherDoctorToken;
let patientToken;
let otherPatientToken;
let doctorId;
let otherDoctorId;
let patientId;
let otherPatientId;
let doctorEmail;
let adminEmail;
let patientEmail;
let patientPhone;
let otherPatientEmail;
let otherPatientPhone;
let contactSuffix;
let appointmentDate;
let uniqueSuffix;

const api = async (method, route, { body, token } = {}) => {
    const response = await fetch(`${baseUrl}${route}`, {
        method,
        headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
};

const registerPatient = (overrides = {}) => api("POST", "/api/patients/register", {
    body: {
        name: "Integration Patient",
        dob: "1990-05-10",
        gender: "Other",
        bloodGroup: "O+",
        email: patientEmail,
        phone: patientPhone,
        password: "TestPass!2345",
        ...overrides
    }
});

const login = async (route, email) => {
    const result = await api("POST", route, { body: { email, password: "TestPass!2345" } });
    assert.equal(result.status, 200);
    return result.data.token;
};

before(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 12000 });
    } catch {
        throw new Error("Could not connect to the isolated HMS integration database; verify Atlas network access and credentials.");
    }

    assert.equal(mongoose.connection.name, testDatabase);
    await Promise.all([
        Admin.init(), Doctor.init(), Patient.init(), Appointment.init(), DoctorSlot.init(), ContactMessage.init()
    ]);

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/api/patients", require("../routes/patientRoutes"));
    app.use("/api/doctors", require("../routes/doctorRoutes"));
    app.use("/api/contact", require("../routes/contactRoutes"));
    app.use("/api/doctor-slots", require("../routes/doctorSlotRoutes"));
    app.use("/api/admin", require("../routes/adminRoutes"));

    await new Promise((resolve) => {
        server = app.listen(0, "127.0.0.1", resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    doctorEmail = `doctor-${uniqueSuffix}@example.test`;
    patientEmail = `patient-${uniqueSuffix}@example.test`;
    patientPhone = `9${uniqueSuffix.slice(-9)}`;
    otherPatientEmail = `patient2-${uniqueSuffix}@example.test`;
    otherPatientPhone = `8${uniqueSuffix.slice(-9)}`;
    contactSuffix = uniqueSuffix;

    const password = await bcrypt.hash("TestPass!2345", 10);
    adminEmail = `admin-${uniqueSuffix}@example.test`;
    const admin = await Admin.create({
        name: "Integration Admin",
        email: adminEmail,
        password
    });
    const doctor = await Doctor.create({
        name: "Integration Doctor",
        specialization: "Cardiology",
        email: doctorEmail,
        phone: `7${uniqueSuffix.slice(-9)}`,
        password,
        experience: 5,
        consultationFee: 400
    });
    const otherDoctor = await Doctor.create({
        name: "Other Integration Doctor",
        specialization: "Neurology",
        email: `doctor2-${uniqueSuffix}@example.test`,
        phone: `6${uniqueSuffix.slice(-9)}`,
        password
    });

    doctorId = doctor._id.toString();
    otherDoctorId = otherDoctor._id.toString();
    adminToken = generateToken(admin._id, "admin");
    doctorToken = generateToken(doctor._id, "doctor");
    otherDoctorToken = generateToken(otherDoctor._id, "doctor");

    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 2);
    appointmentDate = future.toISOString().slice(0, 10);
});

after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
});

test("isolated end-to-end patient, doctor, admin, appointment, and contact workflows", { concurrency: false }, async () => {
    assert.notEqual(mongoose.connection.name, sourceDatabase);

    const health = await api("GET", "/api/doctors/test");
    assert.equal(health.status, 200);

    const publicDoctorList = await api("GET", "/api/doctors/all");
    assert.equal(publicDoctorList.status, 200);
    const publicDoctorFields = new Set([
        "_id", "name", "specialization", "email", "phone", "photo",
        "qualification", "experience", "about", "availability", "consultationFee"
    ]);
    assert.ok(publicDoctorList.data.doctors.every((doctor) =>
        Object.keys(doctor).every((field) => publicDoctorFields.has(field)) && !Object.hasOwn(doctor, "password")
    ));

    const noToken = await api("GET", "/api/patients/all");
    assert.equal(noToken.status, 401);
    const badToken = await api("GET", "/api/doctors/appointments", { token: "not-a-jwt" });
    assert.equal(badToken.status, 401);
    const expiredToken = jwt.sign({ id: doctorId, role: "doctor" }, process.env.JWT_SECRET, { expiresIn: -1 });
    assert.equal((await api("GET", "/api/doctors/appointments", { token: expiredToken })).status, 401);

    assert.equal((await registerPatient({ email: "bad-email" })).status, 400);
    assert.equal((await api("POST", "/api/patients/register", { body: {} })).status, 400);
    assert.equal((await registerPatient()).status, 201);
    assert.equal((await registerPatient()).status, 400);

    let patientLogin = await api("POST", "/api/patients/login", {
        body: { email: patientEmail, password: "incorrect-password" }
    });
    assert.equal(patientLogin.status, 400);
    patientToken = await login("/api/patients/login", patientEmail);
    patientId = (await Patient.findOne({ email: patientEmail }))._id.toString();

    const doctorLogin = await api("POST", "/api/doctors/login", {
        body: { email: doctorEmail, password: "TestPass!2345" }
    });
    assert.equal(doctorLogin.status, 200);
    assert.equal(doctorLogin.data.doctor._id, doctorId);
    assert.equal((await api("POST", "/api/doctors/login", {
        body: { email: doctorEmail, password: "wrong-password" }
    })).status, 400);
    const adminLogin = await api("POST", "/api/admin/login", {
        body: { email: adminEmail, password: "TestPass!2345" }
    });
    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.data.admin._id, (await Admin.findOne({ email: adminEmail }))._id.toString());

    assert.equal((await registerPatient({ email: otherPatientEmail, phone: otherPatientPhone })).status, 201);
    otherPatientToken = await login("/api/patients/login", otherPatientEmail);
    otherPatientId = (await Patient.findOne({ email: otherPatientEmail }))._id.toString();

    assert.equal((await api("GET", "/api/patients/all", { token: patientToken })).status, 403);
    const otherPatientAppointments = await api("GET", "/api/patients/appointments", { token: otherPatientToken });
    assert.equal(otherPatientAppointments.status, 200);
    assert.equal(otherPatientAppointments.data.appointments.length, 0);

    const profile = await api("PUT", "/api/patients/profile", {
        token: patientToken,
        body: {
            name: "Updated Integration Patient",
            dob: "1990-05-10",
            gender: "Other",
            bloodGroup: "O+",
            email: patientEmail,
            phone: patientPhone,
            emergencyContact: "9876543210",
            allergies: "None",
            medicalHistory: "Integration test"
        }
    });
    assert.equal(profile.status, 200);
    assert.equal(profile.data.patient.name, "Updated Integration Patient");
    assert.equal((await Patient.findById(patientId)).allergies, "None");
    const invalidProfile = await api("PUT", "/api/patients/profile", {
        token: patientToken,
        body: {
            name: "Updated Integration Patient",
            dob: "1990-05-10",
            gender: "Other",
            bloodGroup: "O+",
            email: "not-an-email",
            phone: patientPhone
        }
    });
    assert.equal(invalidProfile.status, 400);
    assert.equal((await Patient.findById(patientId)).email, patientEmail);

    const invalidDate = await api("POST", "/api/doctor-slots/generate", {
        token: doctorToken,
        body: { date: "2099-02-30" }
    });
    assert.equal(invalidDate.status, 400);
    const pastDate = await api("POST", "/api/doctor-slots/generate", {
        token: doctorToken,
        body: { date: "2000-01-01" }
    });
    assert.equal(pastDate.status, 400);
    assert.equal((await api("GET", "/api/doctor-slots/available/not-an-id/2099-05-12")).status, 400);

    assert.equal((await api("POST", "/api/doctor-slots/generate", {
        token: doctorToken,
        body: { date: appointmentDate }
    })).status, 201);
    assert.equal((await api("POST", "/api/doctor-slots/generate", {
        token: doctorToken,
        body: { date: appointmentDate }
    })).status, 400);

    let slots = await api("GET", `/api/doctor-slots/available/${doctorId}/${appointmentDate}`);
    assert.equal(slots.status, 200);
    assert.equal(slots.data.slots.length, 14);
    const [contestedSlot, secondSlot] = slots.data.slots;

    assert.equal((await api("PATCH", `/api/doctor-slots/block/${contestedSlot._id}`, { token: otherDoctorToken })).status, 404);
    assert.equal((await api("PATCH", `/api/doctor-slots/block/${contestedSlot._id}`, { token: doctorToken })).status, 200);
    assert.equal((await api("PATCH", `/api/doctor-slots/unblock/${contestedSlot._id}`, { token: doctorToken })).status, 200);
    assert.equal((await api("PATCH", "/api/doctor-slots/block/nope", { token: doctorToken })).status, 400);

    const forgedBooking = await api("POST", "/api/patients/book-appointment", {
        token: patientToken,
        body: {
            doctorId,
            slotId: contestedSlot._id,
            appointmentDate,
            patientName: "Forged Name",
            doctorName: "Forged Doctor",
            department: "Neurology",
            appointmentTime: "23:00"
        }
    });
    assert.equal(forgedBooking.status, 201);

    const doctorAppointments = await api("GET", "/api/doctors/appointments", { token: doctorToken });
    assert.equal(doctorAppointments.status, 200);
    assert.equal(doctorAppointments.data.appointments[0].patientName, "Updated Integration Patient");
    assert.equal(doctorAppointments.data.appointments[0].appointmentTime, `${contestedSlot.startTime} - ${contestedSlot.endTime}`);
    assert.equal((await api("PATCH", `/api/doctor-slots/block/${contestedSlot._id}`, { token: doctorToken })).status, 404);

    const raceResults = await Promise.all([
        api("POST", "/api/patients/book-appointment", {
            token: patientToken,
            body: { doctorId, slotId: secondSlot._id, appointmentDate }
        }),
        api("POST", "/api/patients/book-appointment", {
            token: patientToken,
            body: { doctorId, slotId: secondSlot._id, appointmentDate }
        })
    ]);
    assert.equal(raceResults.filter((result) => result.status === 201).length, 1);
    assert.equal(raceResults.filter((result) => result.status !== 201).length, 1);

    const allDoctorAppointments = await api("GET", "/api/doctors/appointments", { token: doctorToken });
    assert.equal(allDoctorAppointments.data.appointments.length, 2);
    const contestedAppointment = allDoctorAppointments.data.appointments.find((appointment) => appointment.slotId === contestedSlot._id);
    const raceWinnerAppointment = allDoctorAppointments.data.appointments.find((appointment) => appointment.slotId === secondSlot._id);

    const patientAppointments = await api("GET", "/api/patients/appointments", { token: patientToken });
    assert.equal(patientAppointments.status, 200);
    assert.equal(patientAppointments.data.appointments.length, 2);

    const adminList = await api("GET", "/api/patients/all", { token: adminToken });
    assert.equal(adminList.status, 200);
    assert.ok(adminList.data.patients.every((patient) => !Object.hasOwn(patient, "password")));
    const allAppointments = await api("GET", "/api/patients/all-appointments", { token: adminToken });
    assert.equal(allAppointments.status, 200);
    assert.equal(allAppointments.data.appointments.length, 2);
    assert.equal((await api("PATCH", `/api/doctors/appointments/status/${contestedAppointment._id}`, {
        token: doctorToken,
        body: { status: "Completed" }
    })).status, 404);

    const cancelPending = await api("PATCH", `/api/doctors/appointments/status/${contestedAppointment._id}`, {
        token: adminToken,
        body: { status: "Cancelled" }
    });
    assert.equal(cancelPending.status, 200);
    assert.equal((await api("PATCH", `/api/doctors/appointments/status/${contestedAppointment._id}`, {
        token: adminToken,
        body: { status: "Confirmed" }
    })).status, 404);
    const availableAfterCancellation = await api("GET", `/api/doctor-slots/available/${doctorId}/${appointmentDate}`);
    assert.ok(availableAfterCancellation.data.slots.some((slot) => slot._id === contestedSlot._id));

    assert.equal((await api("POST", "/api/patients/book-appointment", {
        token: patientToken,
        body: { doctorId, slotId: contestedSlot._id, appointmentDate }
    })).status, 201);
    const patientCancellationList = await api("GET", "/api/patients/appointments", { token: patientToken });
    const patientCancelable = patientCancellationList.data.appointments.find((appointment) =>
        appointment.slotId === contestedSlot._id && appointment.status === "Pending"
    );
    assert.ok(patientCancelable);
    assert.equal((await api("PATCH", `/api/patients/appointments/${patientCancelable._id}/cancel`, {
        token: otherPatientToken
    })).status, 409);
    const patientCancel = await api("PATCH", `/api/patients/appointments/${patientCancelable._id}/cancel`, {
        token: patientToken
    });
    assert.equal(patientCancel.status, 200);
    assert.equal(patientCancel.data.appointment.status, "Cancelled");
    assert.equal((await api("PATCH", `/api/patients/appointments/${patientCancelable._id}/cancel`, {
        token: patientToken
    })).status, 409);
    const releasedAfterPatientCancel = await api("GET", `/api/doctor-slots/available/${doctorId}/${appointmentDate}`);
    assert.ok(releasedAfterPatientCancel.data.slots.some((slot) => slot._id === contestedSlot._id));
    assert.equal((await api("POST", "/api/patients/book-appointment", {
        token: patientToken,
        body: { doctorId, slotId: contestedSlot._id, appointmentDate }
    })).status, 201);
    const confirmedCancellationList = await api("GET", "/api/patients/appointments", { token: patientToken });
    const patientConfirmed = confirmedCancellationList.data.appointments.find((appointment) =>
        appointment.slotId === contestedSlot._id && appointment.status === "Pending"
    );
    assert.ok(patientConfirmed);
    assert.equal((await api("PATCH", `/api/doctors/appointments/status/${patientConfirmed._id}`, {
        token: adminToken,
        body: { status: "Confirmed" }
    })).status, 200);
    assert.equal((await api("PATCH", `/api/patients/appointments/${patientConfirmed._id}/cancel`, {
        token: patientToken
    })).status, 200);
    const releasedAfterConfirmedCancel = await api("GET", `/api/doctor-slots/available/${doctorId}/${appointmentDate}`);
    assert.ok(releasedAfterConfirmedCancel.data.slots.some((slot) => slot._id === contestedSlot._id));

    const concurrentConfirmations = await Promise.all([
        api("PATCH", `/api/doctors/appointments/status/${raceWinnerAppointment._id}`, {
            token: adminToken,
            body: { status: "Confirmed" }
        }),
        api("PATCH", `/api/doctors/appointments/status/${raceWinnerAppointment._id}`, {
            token: adminToken,
            body: { status: "Confirmed" }
        })
    ]);
    assert.equal(concurrentConfirmations.filter((result) => result.status === 200).length, 1);
    assert.equal(concurrentConfirmations.filter((result) => result.status === 404).length, 1);
    assert.equal((await api("PATCH", `/api/doctors/appointments/status/${raceWinnerAppointment._id}`, {
        token: adminToken,
        body: { status: "Confirmed" }
    })).status, 404);
    assert.equal((await api("PATCH", `/api/doctors/appointments/status/${raceWinnerAppointment._id}`, {
        token: otherDoctorToken,
        body: { status: "Completed" }
    })).status, 404);
    assert.equal((await api("PATCH", `/api/doctors/appointments/status/${raceWinnerAppointment._id}`, {
        token: doctorToken,
        body: { status: "Cancelled" }
    })).status, 400);
    assert.equal((await api("PATCH", "/api/doctors/appointments/status/not-an-id", {
        token: adminToken,
        body: { status: "Confirmed" }
    })).status, 400);
    assert.equal((await api("PATCH", "/api/doctors/appointments/status/000000000000000000000099", {
        token: adminToken,
        body: { status: "Confirmed" }
    })).status, 404);
    assert.equal((await api("PATCH", `/api/doctors/appointments/status/${raceWinnerAppointment._id}`, {
        token: doctorToken,
        body: { status: "Completed" }
    })).status, 200);
    assert.equal((await api("PATCH", `/api/doctors/appointments/status/${raceWinnerAppointment._id}`, {
        token: adminToken,
        body: { status: "Cancelled" }
    })).status, 404);
    assert.equal((await api("PATCH", `/api/patients/appointments/${raceWinnerAppointment._id}/cancel`, {
        token: patientToken
    })).status, 409);

    const persistedAppointments = await api("GET", "/api/patients/appointments", { token: patientToken });
    assert.ok(persistedAppointments.data.appointments.some((appointment) => appointment.status === "Completed"));
    assert.equal((await api("DELETE", `/api/patients/${patientId}`, { token: adminToken })).status, 400);
    assert.equal((await api("DELETE", `/api/doctors/${doctorId}`, { token: adminToken })).status, 400);

    const orphanDelete = await api("DELETE", `/api/patients/${otherPatientId}`, { token: adminToken });
    assert.equal(orphanDelete.status, 200);
    assert.equal(await Patient.findById(otherPatientId), null);

    const invalidDoctor = await api("POST", "/api/doctors/add", {
        token: adminToken,
        body: {
            name: "Invalid Integration Doctor",
            specialization: "Not a department",
            email: `invalid-${uniqueSuffix}@example.test`,
            phone: `9${uniqueSuffix.slice(-8)}1`,
            password: "TestPass!2345"
        }
    });
    assert.equal(invalidDoctor.status, 400);

    const adminCreateDoctor = await api("POST", "/api/doctors/add", {
        token: adminToken,
        body: {
            name: "CRUD Integration Doctor",
            specialization: "Dermatology",
            email: `crud-${uniqueSuffix}@example.test`,
            phone: `9${uniqueSuffix.slice(-8)}0`,
            password: "TestPass!2345",
            experience: 3,
            consultationFee: 250
        }
    });
    assert.equal(adminCreateDoctor.status, 201);
    const createdDoctor = await Doctor.findOne({ email: `crud-${uniqueSuffix}@example.test` });
    const doctorUpdate = await api("PUT", `/api/doctors/${createdDoctor._id}`, {
        token: adminToken,
        body: {
            name: "CRUD Updated Doctor",
            specialization: "Dermatology",
            email: `crud-${uniqueSuffix}@example.test`,
            phone: `9${uniqueSuffix.slice(-8)}0`,
            qualification: "MBBS",
            experience: 4,
            about: "Updated through API",
            availability: true,
            consultationFee: 300
        }
    });
    assert.equal(doctorUpdate.status, 200);
    assert.equal((await Doctor.findById(createdDoctor._id)).name, "CRUD Updated Doctor");
    assert.equal((await api("DELETE", `/api/doctors/${createdDoctor._id}`, { token: adminToken })).status, 200);

    assert.equal((await api("DELETE", "/api/patients/not-an-id", { token: adminToken })).status, 400);
    assert.equal((await api("PUT", "/api/doctors/not-an-id", { token: adminToken, body: {} })).status, 400);

    const contactInvalid = await api("POST", "/api/contact", { body: { email: "not-an-email" } });
    assert.equal(contactInvalid.status, 400);
    const contactValid = await api("POST", "/api/contact", {
        body: {
            name: "Integration Contact",
            email: `contact-${contactSuffix}@example.test`,
            phone: "9876543210",
            category: "General Inquiry",
            subject: "Integration test",
            message: "Created in isolated test database"
        }
    });
    assert.equal(contactValid.status, 201);
});
