const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const parseDateOnly = require("../utils/dateOnly");

const state = {
    patient: { _id: "000000000000000000000001", name: "Real Patient" },
    doctor: { _id: "000000000000000000000002", name: "Dr. Real", specialization: "Cardiology", availability: true },
    slot: { _id: "000000000000000000000003", startTime: "10:00", endTime: "10:30" },
    slotUpdates: [],
    savedAppointments: [],
    appointmentSaveError: null,
    doctorStatusUpdate: null,
    doctorStatusQuery: null,
    doctorStatusResult: null,
    slotQueryResult: null
    ,cancelResult: null
};

const patientModel = {
    findById: async () => state.patient
};

const doctorModel = {
    findById: async () => state.doctor
};

class Appointment {
    constructor(data) {
        Object.assign(this, data);
    }

    async save() {
        if (state.appointmentSaveError) throw state.appointmentSaveError;
        state.savedAppointments.push(this);
        return this;
    }

    static async findByIdAndUpdate(query, update, options) {
        state.doctorStatusQuery = query;
        state.doctorStatusUpdate = { update, options };
        return state.doctorStatusResult;
    }

    static async findOneAndUpdate(query, update, options) {
        state.doctorStatusQuery = query;
        state.doctorStatusUpdate = { update, options };
        if (state.cancelResult) return state.cancelResult;
        return state.doctorStatusResult;
    }
}

const slotModel = {
    async findOneAndUpdate(query, update, options) {
        state.slotUpdates.push({ query, update, options });
        if (state.slotUpdates.length === 1) return state.slotQueryResult || state.slot;
        return null;
    }
};

const replaceModule = (file, exports) => {
    require.cache[require.resolve(file)] = { id: require.resolve(file), filename: require.resolve(file), loaded: true, exports };
};

replaceModule("../models/Patient", patientModel);
replaceModule("../models/Doctor", doctorModel);
replaceModule("../models/Appointment", Appointment);
replaceModule("../models/DoctorSlot", slotModel);

const patientController = require("../controllers/patientController");
const doctorController = require("../controllers/doctorController");

const reset = () => {
    state.slotUpdates = [];
    state.savedAppointments = [];
    state.appointmentSaveError = null;
    state.doctorStatusUpdate = null;
    state.doctorStatusQuery = null;
    state.doctorStatusResult = null;
    state.slotQueryResult = state.slot;
    state.cancelResult = null;
};

const response = () => ({
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
});

const bookingRequest = (overrides = {}) => ({
    user: { id: "000000000000000000000001", role: "patient" },
    body: { doctorId: "000000000000000000000002", slotId: "000000000000000000000003", appointmentDate: "2099-05-12", notes: "Checkup", ...overrides }
});

test("date-only parsing rejects malformed and impossible calendar dates", () => {
    assert.equal(parseDateOnly("2099-05-12").toISOString(), "2099-05-12T00:00:00.000Z");
    assert.equal(parseDateOnly("2024-02-29").toISOString(), "2024-02-29T00:00:00.000Z");
    assert.equal(parseDateOnly("2025-02-29"), null);
    assert.equal(parseDateOnly("2099-5-12"), null);
});

test("frontend HTML escaping neutralizes text and attribute metacharacters", () => {
    const context = { window: {} };
    const source = fs.readFileSync(path.resolve(__dirname, "../../FRONTEND/utils/html.js"), "utf8");
    vm.runInNewContext(source, context);

    assert.equal(
        context.window.escapeHtml(`<img src=x onerror='alert("x")'>&`),
        "&lt;img src=x onerror=&#39;alert(&quot;x&quot;)&#39;&gt;&amp;"
    );
});

test("admin session reader safely handles malformed and valid local storage", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../../FRONTEND/admin/admin-session.js"), "utf8");
    let stored = "{";
    const context = {
        window: {},
        localStorage: { getItem: () => stored }
    };

    vm.runInNewContext(source, context);
    assert.equal(context.window.getAdminSession(), null);

    stored = JSON.stringify({ role: "admin", name: "Test Admin" });
    assert.deepEqual({ ...context.window.getAdminSession() }, { role: "admin", name: "Test Admin" });
});

test("booking claims the matching slot and derives appointment identity from stored records", { concurrency: false }, async () => {
    reset();
    const res = response();

    await patientController.bookAppointment(bookingRequest({
        patientName: "Forged Patient",
        doctorName: "Forged Doctor",
        department: "Neurology",
        appointmentTime: "23:00"
    }), res);

    assert.equal(res.statusCode, 201);
    assert.equal(state.savedAppointments.length, 1);
    assert.equal(state.savedAppointments[0].patientName, "Real Patient");
    assert.equal(state.savedAppointments[0].doctorName, "Dr. Real");
    assert.equal(state.savedAppointments[0].department, "Cardiology");
    assert.equal(state.savedAppointments[0].appointmentTime, "10:00 - 10:30");
    assert.equal(state.slotUpdates[0].query.date.toISOString(), "2099-05-12T00:00:00.000Z");
    assert.equal(state.slotUpdates[0].query.status, "Available");
    assert.equal(state.slotUpdates[0].update.$set.status, "Booked");
});

test("booking rejects malformed dates before claiming a slot", { concurrency: false }, async () => {
    reset();
    const res = response();

    await patientController.bookAppointment(bookingRequest({ appointmentDate: "2099-02-30" }), res);

    assert.equal(res.statusCode, 400);
    assert.equal(state.slotUpdates.length, 0);
    assert.equal(state.savedAppointments.length, 0);
});

test("booking releases its slot claim if appointment persistence fails", { concurrency: false }, async () => {
    reset();
    state.appointmentSaveError = new Error("simulated database error");
    const res = response();
    const oldError = console.error;
    console.error = () => {};

    try {
        await patientController.bookAppointment(bookingRequest(), res);
    } finally {
        console.error = oldError;
    }

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, "Internal server error");
    assert.equal(state.slotUpdates.length, 2);
    assert.equal(state.slotUpdates[1].update.$set.status, "Available");
});

test("doctors cannot confirm appointments through the status API", { concurrency: false }, async () => {
    reset();
    const res = response();

    await doctorController.updateAppointmentStatus({
        user: { id: "000000000000000000000002", role: "doctor" },
        params: { id: "000000000000000000000004" },
        body: { status: "Confirmed" }
    }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(state.doctorStatusUpdate, null);
});

test("admin transition atomically targets pending appointments", { concurrency: false }, async () => {
    reset();
    state.doctorStatusResult = { _id: "000000000000000000000004", status: "Confirmed" };
    const res = response();

    await doctorController.updateAppointmentStatus({
        user: { id: "000000000000000000000005", role: "admin" },
        params: { id: "000000000000000000000004" },
        body: { status: "Confirmed" }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(state.doctorStatusQuery, { _id: "000000000000000000000004", status: "Pending" });
    assert.deepEqual(state.doctorStatusUpdate.options, { returnDocument: "after", runValidators: true });
});

test("admin status update rejects invalid and missing appointment IDs", { concurrency: false }, async () => {
    reset();
    const invalidIdResponse = response();

    await doctorController.updateAppointmentStatus({
        user: { id: "000000000000000000000005", role: "admin" },
        params: { id: "not-an-id" },
        body: { status: "Confirmed" }
    }, invalidIdResponse);

    assert.equal(invalidIdResponse.statusCode, 400);
    assert.equal(state.doctorStatusQuery, null);

    const missingResponse = response();
    state.doctorStatusResult = null;
    await doctorController.updateAppointmentStatus({
        user: { id: "000000000000000000000005", role: "admin" },
        params: { id: "000000000000000000000099" },
        body: { status: "Confirmed" }
    }, missingResponse);

    assert.equal(missingResponse.statusCode, 404);
    assert.deepEqual(state.doctorStatusQuery, {
        _id: "000000000000000000000099",
        status: "Pending"
    });
});

test("patient cancellation releases only its linked booked slot", { concurrency: false }, async () => {
    reset();
    state.cancelResult = {
        _id: "000000000000000000000004",
        patientId: "000000000000000000000001",
        slotId: "000000000000000000000003",
        status: "Pending"
    };
    const res = response();

    await patientController.cancelAppointment({
        user: { id: "000000000000000000000001", role: "patient" },
        params: { id: "000000000000000000000004" }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.appointment.status, "Cancelled");
    assert.deepEqual(state.doctorStatusQuery, {
        _id: "000000000000000000000004",
        patientId: "000000000000000000000001",
        status: { $in: ["Pending", "Confirmed"] }
    });
    assert.equal(state.slotUpdates[0].query.appointmentId, state.cancelResult._id);
    assert.equal(state.slotUpdates[0].update.$set.status, "Available");
    assert.equal(state.slotUpdates[0].update.$set.appointmentId, null);
});

test("patient cancellation rejects ineligible or inaccessible appointments", { concurrency: false }, async () => {
    reset();
    const res = response();
    await patientController.cancelAppointment({
        user: { id: "000000000000000000000001", role: "patient" },
        params: { id: "000000000000000000000004" }
    }, res);

    assert.equal(res.statusCode, 409);
    assert.equal(state.slotUpdates.length, 0);
});

