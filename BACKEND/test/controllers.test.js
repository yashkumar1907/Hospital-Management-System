const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const parseDateOnly = require("../utils/dateOnly");
const { getGrouping, buildTrendSeries } = require("../utils/appointmentTrendSeries");
const { buildQueueRows, getQueueDisplayStatus, getQueueStats, filterQueueRows } = require("../utils/appointmentQueue");

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
    slotQueryResult: null,
    cancelResult: null
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
        if (!this.status) this.status = "Pending";
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

test("daily trend series includes every selected UTC date and zero-fills missing dates", () => {
    const start = parseDateOnly("2026-10-18");
    const end = parseDateOnly("2026-10-25");
    const series = buildTrendSeries(start, end, [
        { date: "2026-10-18", count: 2 },
        { date: "2026-10-21", count: 1 },
        { date: "2026-10-25", count: 3 }
    ]);
    assert.deepEqual(series.map((item) => item.date), [
        "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21",
        "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"
    ]);
    assert.deepEqual(series.map((item) => item.count), [2, 0, 0, 1, 0, 0, 0, 3]);
});

test("trend grouping uses daily buckets through 31 days and monthly buckets beyond", () => {
    const jan1 = parseDateOnly("2026-01-01");
    assert.equal(getGrouping(jan1, parseDateOnly("2026-01-31")), "daily");
    assert.equal(getGrouping(jan1, parseDateOnly("2026-02-01")), "monthly");
    const monthly = buildTrendSeries(jan1, parseDateOnly("2026-03-02"), [
        { date: "2026-01", count: 4 },
        { date: "2026-03", count: 2 }
    ]);
    assert.deepEqual(monthly, [
        { date: "2026-01", count: 4 },
        { date: "2026-02", count: 0 },
        { date: "2026-03", count: 2 }
    ]);
});

test("daily trend series remains zero-filled when there are no appointments", () => {
    const series = buildTrendSeries(parseDateOnly("2026-10-24"), parseDateOnly("2026-10-26"), []);
    assert.deepEqual(series, [
        { date: "2026-10-24", count: 0 },
        { date: "2026-10-25", count: 0 },
        { date: "2026-10-26", count: 0 }
    ]);
});

test("existing appointment statuses map to queue labels, with cancelled and rejected entries excluded", () => {
    assert.equal(getQueueDisplayStatus("Pending"), "Approved Pending");
    assert.equal(getQueueDisplayStatus("Confirmed"), "Approved");
    assert.equal(getQueueDisplayStatus("Completed"), "Completed");
    assert.equal(getQueueDisplayStatus("Cancelled"), null);
    assert.equal(getQueueDisplayStatus("Rejected"), null);
});

test("queue rows sort deterministically and include each eligible appointment once", () => {
    const rows = buildQueueRows([
        { _id: "b", status: "Confirmed", patientName: "Later", appointmentTime: "11:00 - 11:30", createdAt: new Date("2026-01-01") },
        { _id: "a", status: "Pending", patientName: "First", appointmentTime: "10:00 - 10:30", createdAt: new Date("2026-01-02") },
        { _id: "c", status: "Completed", patientName: "Completed", appointmentTime: "10:00 - 10:30", createdAt: new Date("2026-01-01") },
        { _id: "b", status: "Confirmed", patientName: "Duplicate", appointmentTime: "11:00 - 11:30", createdAt: new Date("2026-01-01") },
        { _id: "d", status: "Cancelled", appointmentTime: "09:00 - 09:30" },
        { _id: "e", status: "Rejected", appointmentTime: "09:30 - 10:00" }
    ]);
    assert.deepEqual(rows.map(({ appointmentId, queueNumber, status }) => ({ appointmentId, queueNumber, status })), [
        { appointmentId: "c", queueNumber: 1, status: "Completed" },
        { appointmentId: "a", queueNumber: 2, status: "Approved Pending" },
        { appointmentId: "b", queueNumber: 3, status: "Approved" }
    ]);
});

test("queue counts and status filters use the display labels", () => {
    const rows = buildQueueRows([
        { _id: "1", status: "Pending", patientName: "Alice", appointmentTime: "09:00" },
        { _id: "2", status: "Confirmed", patientName: "Bob", appointmentTime: "10:00" },
        { _id: "3", status: "Completed", patientName: "Alice Smith", appointmentTime: "11:00" }
    ]);
    assert.deepEqual(getQueueStats(rows), { "Approved Pending": 1, Approved: 1, Completed: 1 });
    assert.deepEqual(filterQueueRows(rows, "Approved").map((row) => row.patientName), ["Bob"]);
    assert.deepEqual(filterQueueRows(rows, "all", "#3").map((row) => row.patientName), ["Alice Smith"]);
    assert.deepEqual(filterQueueRows(rows, "Completed", "alice").map((row) => row.queueNumber), [3]);
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
    assert.equal(getQueueDisplayStatus(state.savedAppointments[0].status), "Approved Pending");
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
    assert.equal(getQueueDisplayStatus(res.body.appointment.status), "Approved");
    assert.deepEqual(state.doctorStatusQuery, { _id: "000000000000000000000004", status: "Pending" });
    assert.deepEqual(state.doctorStatusUpdate.options, { returnDocument: "after", runValidators: true });
});

test("doctor completion is reflected as Completed in the patient queue mapping", { concurrency: false }, async () => {
    reset();
    state.doctorStatusResult = { _id: "000000000000000000000004", status: "Completed" };
    const res = response();
    await doctorController.updateAppointmentStatus({
        user: { id: "000000000000000000000002", role: "doctor" },
        params: { id: "000000000000000000000004" },
        body: { status: "Completed" }
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(getQueueDisplayStatus(res.body.appointment.status), "Completed");
    assert.deepEqual(state.doctorStatusQuery, {
        _id: "000000000000000000000004",
        doctorId: "000000000000000000000002",
        status: "Confirmed"
    });
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

test("admin analytics validates date ranges and returns zero-safe metrics", { concurrency: false }, async () => {
    const adminController = require("../controllers/adminController");
    const invalid = response();
    await adminController.getAnalytics({ query: { start: "2025-02-30", end: "2025-03-01" } }, invalid);
    assert.equal(invalid.statusCode, 400);

    const oldCountDocuments = patientModel.countDocuments;
    const oldAggregate = Appointment.aggregate;
    const oldFind = Appointment.find;
    const aggregatePipelines = [];
    patientModel.countDocuments = async () => 12;
    Appointment.aggregate = async (pipeline) => { aggregatePipelines.push(pipeline); return []; };
    Appointment.find = () => ({
        select() { return this; },
        sort() { return this; },
        limit() { return this; },
        lean: async () => []
    });
    try {
        const res = response();
        await adminController.getAnalytics({ query: { start: "2025-03-01", end: "2025-03-07" } }, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.kpis.registeredPatients, 12);
        assert.equal(res.body.kpis.totalAppointments, 0);
        assert.equal(res.body.kpis.cancellationRate, 0);
        assert.equal(res.body.period.grouping, "daily");
        assert.deepEqual(res.body.trends, [
            { date: "2025-03-01", count: 0 }, { date: "2025-03-02", count: 0 },
            { date: "2025-03-03", count: 0 }, { date: "2025-03-04", count: 0 },
            { date: "2025-03-05", count: 0 }, { date: "2025-03-06", count: 0 },
            { date: "2025-03-07", count: 0 }
        ]);
        const dailyTrendPipeline = aggregatePipelines.find((pipeline) => pipeline[1]?.$group?._id?.$dateToString);
        assert.deepEqual(dailyTrendPipeline[0].$match.appointmentDate.$gte.toISOString(), "2025-03-01T00:00:00.000Z");
        assert.deepEqual(dailyTrendPipeline[0].$match.appointmentDate.$lt.toISOString(), "2025-03-08T00:00:00.000Z");
        assert.equal(dailyTrendPipeline[1].$group._id.$dateToString.format, "%Y-%m-%d");
        assert.deepEqual(res.body.recentAppointments, []);

        aggregatePipelines.length = 0;
        const monthly = response();
        await adminController.getAnalytics({ query: { start: "2026-01-01", end: "2026-03-02" } }, monthly);
        assert.equal(monthly.statusCode, 200);
        assert.equal(monthly.body.period.grouping, "monthly");
        assert.deepEqual(monthly.body.trends, [
            { date: "2026-01", count: 0 }, { date: "2026-02", count: 0 }, { date: "2026-03", count: 0 }
        ]);
        const boundaryTrendPipeline = aggregatePipelines.find((pipeline) => pipeline[1]?.$group?._id?.$dateToString);
        assert.equal(boundaryTrendPipeline[1].$group._id.$dateToString.format, "%Y-%m");
        assert.equal(boundaryTrendPipeline[0].$match.appointmentDate.$gte.toISOString(), "2026-01-01T00:00:00.000Z");
        assert.equal(boundaryTrendPipeline[0].$match.appointmentDate.$lt.toISOString(), "2026-03-03T00:00:00.000Z");
    } finally {
        patientModel.countDocuments = oldCountDocuments;
        Appointment.aggregate = oldAggregate;
        Appointment.find = oldFind;
    }
});

test("admin queue fetch is date-scoped and includes the complete appointment lifecycle", { concurrency: false }, async () => {
    const adminController = require("../controllers/adminController");
    const oldFind = Appointment.find;
    const requestedQueries = [];
    const records = {
        "2026-10-24": [
            { _id: "pending", status: "Pending", patientName: "Booked", appointmentTime: "09:00", appointmentDate: parseDateOnly("2026-10-24"), createdAt: new Date("2026-01-01") },
            { _id: "approved", status: "Confirmed", patientName: "Approved", appointmentTime: "09:30", appointmentDate: parseDateOnly("2026-10-24"), createdAt: new Date("2026-01-01") },
            { _id: "done", status: "Completed", patientName: "Finished", appointmentTime: "10:00", appointmentDate: parseDateOnly("2026-10-24"), createdAt: new Date("2026-01-01") },
            { _id: "cancelled", status: "Cancelled", patientName: "Cancelled", appointmentTime: "08:00", appointmentDate: parseDateOnly("2026-10-24") },
            { _id: "pending", status: "Pending", patientName: "Duplicate", appointmentTime: "09:00", appointmentDate: parseDateOnly("2026-10-24"), createdAt: new Date("2026-01-01") }
        ],
        "2026-10-25": [{ _id: "next-day", status: "Confirmed", patientName: "Next day", appointmentTime: "11:00", appointmentDate: parseDateOnly("2026-10-25") }]
    };
    Appointment.find = (query) => {
        requestedQueries.push(query);
        return { select() { return this; }, sort() { return this; }, lean: async () => records[query.appointmentDate.toISOString().slice(0, 10)] || [] };
    };
    try {
        for (const date of ["2026-10-24", "2026-10-25"]) {
            const res = response();
            await adminController.getPatientQueue({ query: { date } }, res);
            assert.equal(res.statusCode, 200);
            assert.equal(res.body.date, date);
            assert.ok(res.body.queue.every((row) => row.appointmentDate.toISOString().startsWith(date)));
            if (date === "2026-10-24") {
                assert.deepEqual(res.body.queue.map((row) => row.status), ["Approved Pending", "Approved", "Completed"]);
                assert.deepEqual(res.body.stats, { "Approved Pending": 1, Approved: 1, Completed: 1 });
                assert.deepEqual(res.body.queue.map((row) => row.queueNumber), [1, 2, 3]);
            } else {
                assert.deepEqual(res.body.queue.map((row) => row.patientName), ["Next day"]);
                assert.deepEqual(res.body.stats, { "Approved Pending": 0, Approved: 1, Completed: 0 });
            }
        }
        assert.equal(requestedQueries[0].appointmentDate.toISOString(), "2026-10-24T00:00:00.000Z");
        assert.deepEqual(requestedQueries[0].status.$in, ["Pending", "Confirmed", "Completed"]);
        assert.equal(requestedQueries[1].appointmentDate.toISOString(), "2026-10-25T00:00:00.000Z");
    } finally {
        Appointment.find = oldFind;
    }
});

test("admin role middleware denies patients access to queue management", () => {
    const roleMiddleware = require("../middlewares/roleMiddleware");
    let passed = false;
    const res = response();
    roleMiddleware("admin")({ user: { role: "patient" } }, res, () => { passed = true; });
    assert.equal(res.statusCode, 403);
    assert.equal(passed, false);
    roleMiddleware("admin")({ user: { role: "doctor" } }, res, () => { passed = true; });
    assert.equal(res.statusCode, 403);
    assert.equal(passed, false);
    roleMiddleware("admin")({ user: { role: "admin" } }, res, () => { passed = true; });
    assert.equal(passed, true);
});

test("queue is read-only and its endpoint remains admin-protected", () => {
    const router = require("../routes/adminRoutes");
    const queueRoutes = router.stack.map((layer) => layer.route).filter((route) => route?.path === "/queue");
    assert.equal(queueRoutes.length, 1);
    assert.equal(queueRoutes[0].methods.get, true);
    assert.equal(queueRoutes[0].methods.patch, undefined);
    assert.equal(queueRoutes[0].stack.length, 3);
    assert.equal(queueRoutes[0].stack[0].handle, require("../middlewares/authMiddleware"));

    const html = fs.readFileSync(path.resolve(__dirname, "../../FRONTEND/admin/queue/admin-patient-queue.html"), "utf8");
    const script = fs.readFileSync(path.resolve(__dirname, "../../FRONTEND/admin/queue/admin-patient-queue.js"), "utf8");
    assert.doesNotMatch(html, /<th>Action<\/th>|queue-action/);
    assert.doesNotMatch(script, /queue-action|method:\s*["']PATCH["']/);
});

