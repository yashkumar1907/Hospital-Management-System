const DAY_MS = 24 * 60 * 60 * 1000;

const getGrouping = (start, end) => ((end - start) / DAY_MS) + 1 <= 31 ? "daily" : "monthly";

const buildTrendSeries = (start, end, groupedCounts, grouping = getGrouping(start, end)) => {
    const counts = new Map(groupedCounts.map((item) => [item.date, item.count]));
    const series = [];
    const cursor = new Date(start);
    cursor.setUTCHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setUTCHours(0, 0, 0, 0);

    while (cursor <= last) {
        const key = grouping === "daily"
            ? cursor.toISOString().slice(0, 10)
            : cursor.toISOString().slice(0, 7);
        if (series.length === 0 || series[series.length - 1].date !== key) {
            series.push({ date: key, count: counts.get(key) || 0 });
        }
        if (grouping === "daily") cursor.setUTCDate(cursor.getUTCDate() + 1);
        else cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
    }
    return series;
};

module.exports = { getGrouping, buildTrendSeries };
