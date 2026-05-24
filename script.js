const BASE_URL = 'http://127.0.0.1:8888';
let isLogin = true;

document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('table-btn')) {
        const ticketId = e.target.dataset.id;
        const action = e.target.dataset.action;
        if (action === 'assign') assignToMe(ticketId);
        else if (action === 'resolve') updateStatus(ticketId, 'Resolved');
    }
});

async function loadTickets(tableId, statsId = null, isQueuePage = false) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const res = await fetch(`${BASE_URL}/tickets`);
    const tickets = await res.json();
    
    table.innerHTML = `<tr><th>Title</th><th>Dept</th><th>Status</th>${isQueuePage ? '<th>Action</th>' : ''}</tr>`;

    tickets.forEach(t => {
        const status = (t.status || "open").trim().toLowerCase();
        const row = table.insertRow();
        
        row.innerHTML = `
            <td>${t.title}</td>
            <td>${t.department}</td>
            <td>${status.charAt(0).toUpperCase() + status.slice(1)}</td>
            ${isQueuePage ? `<td class="action-cell"></td>` : ''}
        `;

        if (isQueuePage) {
            const actionCell = row.querySelector(".action-cell");
            
            if (status !== 'resolved') {
                const btn = document.createElement("button");
                btn.className = "table-btn";
                btn.dataset.id = t.id;
                
                if (status === 'open' && t.assigned_to === 'unassigned') {
                    btn.innerText = "Take it";
                    btn.dataset.action = 'assign';
                } else {
                    btn.innerText = "Resolve";
                    btn.dataset.action = 'resolve';
                }
                actionCell.appendChild(btn);
            } else {
                actionCell.innerHTML = "<span>✅ Done</span>";
            }
        }
    });

    if (statsId) {
        const statsDiv = document.getElementById(statsId);
        if (statsDiv) statsDiv.innerText = `Total Tickets: ${tickets.length}`;
    }
}

async function assignToMe(ticketId) {
    const agentName = localStorage.getItem('username');
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/assign?agent_name=${agentName}`, { method: 'PUT' });
    if (res.ok) { location.reload(); } else { alert("Error: " + await res.text()); }
}

async function updateStatus(ticketId, newStatus) {
    await fetch(`${BASE_URL}/tickets/${ticketId}/assign?status=${newStatus}`, { method: 'PUT' });
    location.reload();
}

// باقي الفانكشنز كما هي (handleAuth, submitTicket, logout)
async function handleAuth() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const url = isLogin ? `${BASE_URL}/login` : `${BASE_URL}/signup`;
    const params = new URLSearchParams({ username, password });
    if (!isLogin) params.append('role', role);
    const res = await fetch(`${url}?${params}`, { method: 'POST' });
    if (res.ok) {
        if (isLogin) {
            const data = await res.json();
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', username);
            window.location.href = data.role === 'manager' ? 'dashboard.html' : (data.role === 'agent' ? 'queue.html' : 'intake.html');
        } else {
            alert("تم التسجيل! سجل دخولك.");
            toggleAuth();
        }
    } else { alert("خطأ في العملية!"); }
}

function toggleAuth() {
    isLogin = !isLogin;
    document.getElementById('title').innerText = isLogin ? "Login" : "Sign Up";
    document.getElementById('authBtn').innerText = isLogin ? "Login" : "Sign Up";
    document.getElementById('role').style.display = isLogin ? "none" : "block";
    document.getElementById('toggleText').innerText = isLogin ? "Switch to Sign Up" : "Switch to Login";
}

async function submitTicket() {
    const title = document.getElementById('ticketTitle').value;
    const dept = document.getElementById('department').value;
    const user = localStorage.getItem('username');
    if (!title) { alert("اكتبي العنوان!"); return; }
    const res = await fetch(`${BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, department: dept, created_by: user })
    });
    if (res.ok) { location.reload(); } else { alert("فشل الإرسال!"); }
}

async function logout() {
    await fetch(`${BASE_URL}/logout?username=${localStorage.getItem('username')}`, { method: 'POST' });
    localStorage.removeItem('username');
    window.location.href = "index.html";
}