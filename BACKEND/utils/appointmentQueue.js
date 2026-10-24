const APPOINTMENT_QUEUE_STATUSES = Object.freeze({
    Pending: "Approved Pending",
    Confirmed: "Approved",
    Completed: "Completed"
});

const QUEUE_DISPLAY_STATUSES = Object.freeze(Object.values(APPOINTMENT_QUEUE_STATUSES));

const getQueueDisplayStatus = (appointmentStatus) => APPOINTMENT_QUEUE_STATUSES[appointmentStatus] || null;

const getQueueStats = (rows) => {
    const stats = Object.fromEntries(QUEUE_DISPLAY_STATUSES.map((status) => [status, 0]));
    rows.forEach((row) => { stats[row.status] += 1; });
    return stats;
};

const filterQueueRows = (rows, status = "all", search = "") => {
    const term = String(search).trim().toLocaleLowerCase().replace(/^#/, "");
    return rows.filter((row) => (status === "all" || row.status === status) &&
        (!term || String(row.patientName || "").toLocaleLowerCase().includes(term) || String(row.queueNumber).includes(term)));
};

const buildQueueRows = (appointments) => {
    const uniqueAppointments = new Map();
    appointments.forEach((appointment) => {
        const displayStatus = getQueueDisplayStatus(appointment.status);
        if (!displayStatus || !appointment._id) return;
        const key = String(appointment._id);
        if (!uniqueAppointments.has(key)) uniqueAppointments.set(key, { ...appointment, displayStatus });
    });

    return [...uniqueAppointments.values()]
        .sort((left, right) => String(left.appointmentTime || "").localeCompare(String(right.appointmentTime || "")) ||
            new Date(left.createdAt || 0) - new Date(right.createdAt || 0) || String(left._id).localeCompare(String(right._id)))
        .map((appointment, index) => ({
            appointmentId: appointment._id,
            queueNumber: index + 1,
            patientName: appointment.patientName || "-",
            doctorName: appointment.doctorName || "-",
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime || "-",
            status: appointment.displayStatus
        }));
};

module.exports = { QUEUE_DISPLAY_STATUSES, getQueueDisplayStatus, buildQueueRows, getQueueStats, filterQueueRows };
