let currentWeek = 'A';
let currentDay = 'ALL';

const btnWeekA = document.getElementById('btn-week-a');
const btnWeekB = document.getElementById('btn-week-b');
const btnWeekAll = document.getElementById('btn-week-all');
const dayTabsContainer = document.getElementById('day-tabs');
const timetable = document.getElementById('timetable');
const focusSelect = document.getElementById('focus-select');
const groupSelect = document.getElementById('group-select');
const seminarSelect = document.getElementById('seminar-select');
const btnExport = document.getElementById('btn-export');

btnWeekA.addEventListener('click', () => setWeek('A'));
btnWeekB.addEventListener('click', () => setWeek('B'));
btnWeekAll.addEventListener('click', () => setWeek('ALL'));
focusSelect.addEventListener('change', renderSchedule);
groupSelect.addEventListener('change', renderSchedule);
seminarSelect.addEventListener('change', renderSchedule);

if (btnExport) {
    btnExport.addEventListener('click', () => {
        const timetableElement = document.getElementById('timetable');
        html2canvas(timetableElement, {
            backgroundColor: '#0f172a',
            scale: 2
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `rozvrh_${currentWeek === 'ALL' ? 'oba_tydny' : 'tyden_' + currentWeek}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });
}

function init() {
    renderDayTabs();
    renderSchedule();
}

function setWeek(week) {
    currentWeek = week;
    btnWeekA.classList.toggle('active', week === 'A');
    btnWeekB.classList.toggle('active', week === 'B');
    btnWeekAll.classList.toggle('active', week === 'ALL');
    renderSchedule();
}

function setDay(dayId) {
    currentDay = dayId;
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.day == currentDay);
    });
    renderSchedule();
}

function renderDayTabs() {
    dayTabsContainer.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = `day-tab ${currentDay === 'ALL' ? 'active' : ''}`;
    allBtn.textContent = 'Celý týden';
    allBtn.dataset.day = 'ALL';
    allBtn.addEventListener('click', () => setDay('ALL'));
    dayTabsContainer.appendChild(allBtn);

    scheduleData.days.forEach(day => {
        const btn = document.createElement('button');
        btn.className = `day-tab ${day.id === currentDay ? 'active' : ''}`;
        btn.textContent = day.name;
        btn.dataset.day = day.id;
        btn.addEventListener('click', () => setDay(day.id));
        dayTabsContainer.appendChild(btn);
    });
}

const SUBJECT_COLORS = {
    'ztd': '#9b59b6',
    'ops': '#e74c3c',
    'anj': '#3498db',
    'tev': '#1abc9c',
    'pos': '#27ae60',
    'mat': '#f39c12',
    'aut': '#e67e22',
    'pad': '#2980b9',
    'tvy': '#16a085',
    'obn': '#7f8c8d',
    'cjl': '#8e44ad',
    'msem': '#d35400',
    'msea': '#c0392b',
    'eko': '#f1c40f',
    'grw': '#1d8348',
    'prcv': '#2c3e50',
    'nej': '#6c5ce7',
    'cian': '#0984e3',
};

function getSubjectColor(subject) {
    const key = subject.toLowerCase().replace(/[^a-z]/g, '');
    return SUBJECT_COLORS[key] || '#4a5568';
}

function shouldShowLesson(lesson) {
    const focusFilter = focusSelect.value;
    const groupFilter = groupSelect.value;
    const seminarFilter = seminarSelect.value;

    if (lesson.group === 'ALL') return true;

    // Focus groups
    const focusGroupMap = {
        'SITE': ['SITE'],
        'AUTO': ['AUTO'],
        'GRAF': ['GRAF1', 'GRAF'],
        'PROG1': ['PROG1', 'PROG1/2'],
        'PROG2': ['PROG2', 'PROG1/2'],
        'PROG3': ['PROG3'],
    };

    if (focusFilter !== 'ALL') {
        const allowed = focusGroupMap[focusFilter] || [focusFilter];
        const isFocusGroup = Object.values(focusGroupMap).flat().includes(lesson.group);
        if (isFocusGroup && !allowed.includes(lesson.group)) return false;
    }

    // SKP/PRC/NEJ filter
    const skpGroupMap = {
        'SKP1': ['SKP1', 'PRC1', 'TEV2', 'NEJ1', 'MSEa1'],
        'SKP2': ['SKP2', 'PRC2', 'TEV1', 'NEJ2', 'MSEa2'],
    };
    if (groupFilter !== 'ALL') {
        const allowed = skpGroupMap[groupFilter] || [groupFilter];
        const isSkpGroup = Object.values(skpGroupMap).flat().includes(lesson.group);
        if (isSkpGroup && !allowed.includes(lesson.group)) return false;
    }

    // Seminar filter
    const seminarGroupMap = {
        'MSEM': ['MSEm'],
        'MSEA': ['MSEa1', 'MSEa2'],
    };
    if (seminarFilter !== 'ALL') {
        const allowed = seminarGroupMap[seminarFilter] || [seminarFilter];
        const isSeminarGroup = Object.values(seminarGroupMap).flat().includes(lesson.group);
        if (isSeminarGroup && !allowed.includes(lesson.group)) return false;
    }

    return true;
}

// Build timetable: one header row + one row per day
// Each row is a CSS Grid with 12 columns: col1=day label, col2-12=periods 0-10
function renderSchedule() {
    timetable.innerHTML = '';

    // Header row: period numbers and times
    const headerRow = document.createElement('div');
    headerRow.className = 'tt-header-row';

    // Empty corner cell
    const corner = document.createElement('div');
    corner.className = 'tt-corner';
    headerRow.appendChild(corner);

    scheduleData.periods.forEach(p => {
        const cell = document.createElement('div');
        cell.className = 'tt-header-cell';
        cell.innerHTML = `<span class="period-num">${p.id}</span><span class="period-time">${p.time}</span>`;
        headerRow.appendChild(cell);
    });
    timetable.appendChild(headerRow);

    // Day rows
    const daysToRender = currentDay === 'ALL'
        ? scheduleData.days.map(d => d.id)
        : [parseInt(currentDay)];

    daysToRender.forEach(dayId => {
        const dayInfo = scheduleData.days.find(d => d.id === dayId);
        const dayRow = renderDayRow(dayId, dayInfo);
        timetable.appendChild(dayRow);
    });
}

function renderDayRow(dayId, dayInfo) {
    const rowWrapper = document.createElement('div');
    rowWrapper.className = 'tt-day-wrapper';

    // Day label
    const label = document.createElement('div');
    label.className = 'tt-day-label';
    label.innerHTML = `<span class="day-short">${dayInfo.short}</span><span class="day-full">${dayInfo.name}</span>`;
    rowWrapper.appendChild(label);

    // Grid of period cells for this day
    const grid = document.createElement('div');
    grid.className = 'tt-periods-grid';
    rowWrapper.appendChild(grid);

    // Create 10 background "column" cells (periods 0-9)
    for (let p = 0; p < 10; p++) {
        const bg = document.createElement('div');
        bg.className = 'tt-period-bg';
        bg.style.gridColumn = `${p + 1}`;
        // gridRow will be set after maxRow is calculated
        grid.appendChild(bg);
    }

    // Get filtered lessons for this day and week
    let rawLessons = scheduleData.lessons.filter(l => (currentWeek === 'ALL' || l.week === currentWeek) && l.day === dayId);
    rawLessons = rawLessons.filter(shouldShowLesson);

    let lessons = [];
    if (currentWeek === 'ALL') {
        const lessonMap = new Map();
        rawLessons.forEach(l => {
            const key = `${l.period}-${l.duration}-${l.subject}-${l.teacher}-${l.room}-${l.group}`;
            if (lessonMap.has(key)) {
                lessonMap.get(key).isBoth = true;
            } else {
                lessonMap.set(key, { ...l, isBoth: false });
            }
        });
        lessons = Array.from(lessonMap.values());
    } else {
        lessons = rawLessons.map(l => ({ ...l, isBoth: false }));
    }

    // Sort by period, then by week so A comes before B if both exist
    lessons.sort((a, b) => {
        if (a.period !== b.period) return a.period - b.period;
        return a.week.localeCompare(b.week);
    });

    if (lessons.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'tt-empty';
        empty.style.gridColumn = '1 / 12';
        grid.appendChild(empty);
        return rowWrapper;
    }

    // Assign rows for overlapping lessons using greedy interval scheduling
    // Each lesson occupies columns [period+1, period+duration]
    const assignedRows = assignRows(lessons);
    const maxRow = Math.max(...Object.values(assignedRows)) + 1;

    // Update background cells to span the actual number of rows
    const bgs = grid.querySelectorAll('.tt-period-bg');
    bgs.forEach(bg => {
        bg.style.gridRow = `1 / ${maxRow + 1}`;
    });

    lessons.forEach((lesson, idx) => {
        const row = assignedRows[idx];
        const colStart = lesson.period + 1;
        const colEnd = colStart + lesson.duration;

        const el = document.createElement('div');
        el.className = 'tt-lesson';
        el.style.gridColumn = `${colStart} / ${colEnd}`;
        el.style.gridRow = `${row + 1}`;
        el.style.backgroundColor = getSubjectColor(lesson.subject);

        const groupBadge = lesson.group !== 'ALL'
            ? `<span class="lesson-group">${lesson.group}</span>`
            : '';
            
        const weekBadge = (currentWeek === 'ALL' && !lesson.isBoth)
            ? `<span class="lesson-group" style="background: rgba(0,0,0,0.3)">Týden ${lesson.week}</span>`
            : '';

        el.innerHTML = `
            <div class="lesson-top">
                ${weekBadge}
                <span class="lesson-room">${lesson.room}</span>
            </div>
            <div class="lesson-subject">${lesson.subject}</div>
            <div class="lesson-bottom">
                <span class="lesson-teacher">${lesson.teacher}</span>
                ${groupBadge}
            </div>
        `;

        grid.appendChild(el);
    });

    return rowWrapper;
}

/**
 * Greedy algorithm to assign row indices to lessons so overlapping ones get different rows.
 * Returns an object mapping lesson index -> row number (0-based).
 */
function assignRows(lessons) {
    const rows = {};  // lesson index -> row
    const rowEnds = []; // rowEnds[r] = end period of last lesson in row r

    lessons.forEach((lesson, idx) => {
        const start = lesson.period;
        const end = lesson.period + lesson.duration;

        // Find first row where this lesson fits (doesn't overlap)
        let placedRow = -1;
        for (let r = 0; r < rowEnds.length; r++) {
            if (rowEnds[r] <= start) {
                placedRow = r;
                rowEnds[r] = end;
                break;
            }
        }

        if (placedRow === -1) {
            placedRow = rowEnds.length;
            rowEnds.push(end);
        }

        rows[idx] = placedRow;
    });

    return rows;
}

init();
