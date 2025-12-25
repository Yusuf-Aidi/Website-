/* script.js
  Features:
  - CRUD (localStorage or API)
  - Search
  - Pagination
  - Sorting
  - Export CSV / Excel / PDF
  - Basic form validation
*/

(() => {
  // DOM
  const tabs = document.querySelectorAll('.nav-btn');
  const tabElems = { dashboard: document.getElementById('tab-dashboard'), input: document.getElementById('tab-input'), database: document.getElementById('tab-database') };

  const form = document.getElementById('employeeForm');
  const f_id = document.getElementById('employee_id');
  const f_name = document.getElementById('name');
  const f_position = document.getElementById('position');
  const f_date = document.getElementById('date_joined');
  const f_phone = document.getElementById('phone');
  const f_email = document.getElementById('email');
  const f_address = document.getElementById('address');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const formModeEl = document.getElementById('formMode');

  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const tbody = document.getElementById('employeeTbody');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const paginationInfo = document.getElementById('paginationInfo');

  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportXlsBtn = document.getElementById('exportXlsBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');

  const modalDelete = document.getElementById('modalDelete');
  const cancelDelete = document.getElementById('cancelDelete');
  const confirmDelete = document.getElementById('confirmDelete');

  // Config
  const PAGE_SIZE = 6;
  let currentPage = 1;
  let totalPages = 1;
  let sortBy = sortSelect ? sortSelect.value : 'name_asc';
  let qSearch = '';
  let editModeId = null;
  let pendingDeleteId = null;

  // Helpers
  function uid(){ return 'EMP-' + Math.random().toString(36).slice(2,9).toUpperCase(); }

  // Storage / API layer (switchable)
  async function apiRequest(method='GET', data=null, id=null) {
    if(!window.USE_API) {
      // localStorage fallback
      const key = 'employees-demo';
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      if(method === 'GET') return arr;
      if(method === 'CREATE') { arr.push(data); localStorage.setItem(key, JSON.stringify(arr)); return data; }
      if(method === 'UPDATE') {
        const idx = arr.findIndex(x => x.employee_id === id);
        if(idx>=0){ arr[idx] = data; localStorage.setItem(key, JSON.stringify(arr)); return data; } else throw 'Not found';
      }
      if(method === 'DELETE') {
        const idx = arr.findIndex(x => x.employee_id === id);
        if(idx>=0){ arr.splice(idx,1); localStorage.setItem(key, JSON.stringify(arr)); return true; } else throw 'Not found';
      }
    } else {
      // call backend API
      const url = API_BASE + (id ? ('?id='+encodeURIComponent(id)) : '');
      const opts = { method: method === 'CREATE' ? 'POST' : (method === 'UPDATE' ? 'PUT' : (method === 'DELETE' ? 'DELETE' : 'GET')), headers:{} };
      if(data) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(data); }
      const res = await fetch(url, opts);
      if(!res.ok) throw await res.text();
      const json = await res.json();
      return json;
    }
  }

  // CRUD wrappers
  async function loadAll(){
    const res = await apiRequest('GET');
    return res || [];
  }
  async function createEmployee(emp){
    return await apiRequest('CREATE', emp);
  }
  async function updateEmployee(id, emp){
    return await apiRequest('UPDATE', emp, id);
  }
  async function deleteEmployeeAPI(id){
    return await apiRequest('DELETE', null, id);
  }

  // Render & operations
  async function refreshUI(){
    let data = await loadAll();

    // compute stats for dashboard
    const countAll = data.length;
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate()-30);
    const countNew = data.filter(d => d.date_joined && new Date(d.date_joined) >= thirtyDaysAgo).length;
    document.getElementById('countAll').textContent = countAll;
    document.getElementById('countNew').textContent = countNew;

    // search
    if(qSearch){
      const q = qSearch.toLowerCase();
      data = data.filter(d => (d.name||'').toLowerCase().includes(q) || (d.employee_id||'').toLowerCase().includes(q) || (d.position||'').toLowerCase().includes(q) );
    }

    // sort
    data.sort((a,b) => {
      if(sortBy === 'name_asc') return (a.name||'').localeCompare(b.name||'');
      if(sortBy === 'name_desc') return (b.name||'').localeCompare(a.name||'');
      if(sortBy === 'date_desc') return (new Date(b.date_joined||0) - new Date(a.date_joined||0));
      if(sortBy === 'date_asc') return (new Date(a.date_joined||0) - new Date(b.date_joined||0));
      return 0;
    });
    // search
    if(qSearch){
      const q = qSearch.toLowerCase();
      data = data.filter(d => (d.name||'').toLowerCase().includes(q) || (d.employee_id||'').toLowerCase().includes(q) || (d.position||'').toLowerCase().includes(q) );
    }

    // sort
    data.sort((a,b) => {
      if(sortBy === 'name_as') return (a.name||'').localeCompare(b.name||'');
      if(sortBy === 'name_des') return (b.name||'').localeCompare(a.name||'');
      if(sortBy === 'date_des') return (new Date(b.date_joined||0) - new Date(a.date_joined||0));
      if(sortBy === 'date_as') return (new Date(a.date_joined||0) - new Date(b.date_joined||0));
      return 0;
    });

    // pagination
    totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    if(currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage-1)*PAGE_SIZE;
    const pageData = data.slice(start, start + PAGE_SIZE);

    // render table
    tbody.innerHTML = '';
    if(pageData.length === 0){
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:12px;color:#64748b">Tidak ada data.</td></tr>';
    } else {
      for(const emp of pageData){
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${emp.employee_id||''}</td>
          <td>${emp.name||''}</td>
          <td>${emp.position||''}</td>
          <td>${emp.phone||''}</td>
          <td>${emp.date_joined ? new Date(emp.date_joined).toLocaleDateString() : '-'}</td>
          <td>
            <button class="btn-ghost" data-act="edit" data-id="${emp.employee_id}">Edit</button>
            <button class="btn-ghost" data-act="delete" data-id="${emp.employee_id}">Hapus</button>
          </td>
        `;
        tbody.appendChild(tr);
      }
    }

    paginationInfo.textContent = `Halaman ${currentPage} / ${totalPages}`;
  }

  // Form actions
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const values = {
      employee_id: f_id.value.trim() || uid(),
      name: f_name.value.trim(),
      position: f_position.value.trim(),
      date_joined: f_date.value || null,
      phone: f_phone.value.trim(),
      email: f_email.value.trim(),
      address: f_address.value.trim()
    };

    // simple validation
    if(!values.name || !values.position){
      alert('Nama dan Jabatan wajib diisi.'); return;
    }

    try {
      if(editModeId){
        // update
        await updateEmployee(editModeId, values);
        alert('Data diperbarui.');
      } else {
        // create (ensure unique id for localStorage)
        await createEmployee(values);
        alert('Data ditambahkan.');
      }
      form.reset();
      editModeId = null;
      formModeEl.innerHTML = 'Mode: <b>Tambah</b>';
      await refreshUI();
      // switch to database tab
      setActiveTab('database');
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan: ' + err);
    }
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    editModeId = null;
    formModeEl.innerHTML = 'Mode: <b>Tambah</b>';
  });

  // table button actions (delegation)
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if(!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;
    if(act === 'edit'){
      startEdit(id);
    } else if(act === 'delete'){
      pendingDeleteId = id;
      modalDelete.style.display = 'flex';
    }
  });

  cancelDelete.addEventListener('click', () => { pendingDeleteId = null; modalDelete.style.display = 'none'; });
  confirmDelete.addEventListener('click', async () => {
    if(!pendingDeleteId) return;
    try{
      await deleteEmployeeAPI(pendingDeleteId);
      pendingDeleteId = null; modalDelete.style.display = 'none';
      await refreshUI();
      alert('Data dihapus.');
    } catch(err){ console.error(err); alert('Gagal menghapus: ' + err); }
  });

  // edit
  async function startEdit(id){
    const all = await loadAllData();
    const emp = all.find(x => x.employee_id === id);
    if(!emp){ alert('Data tidak ditemukan'); return; }
    f_id.value = emp.employee_id;
    f_name.value = emp.name;
    f_position.value = emp.position;
    f_date.value = emp.date_joined || '';
    f_phone.value = emp.phone || '';
    f_email.value = emp.email || '';
    f_address.value = emp.address || '';
    editModeId = id;
    formModeEl.innerHTML = 'Mode: <b>Ubah</b>';
    setActiveTab('input');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  // helper to load all regardless of paging
  async function loadAllData(){ return await loadAll(); }

  // search / sort / pagination controls
  searchInput && searchInput.addEventListener('input', (e) => { qSearch = e.target.value.trim(); currentPage = 1; refreshUI(); });
  sortSelect && sortSelect.addEventListener('change', (e)=>{ sortBy = e.target.value; currentPage = 1; refreshUI(); });

  prevPageBtn && prevPageBtn.addEventListener('click', ()=>{ if(currentPage>1){ currentPage--; refreshUI(); }});
  nextPageBtn && nextPageBtn.addEventListener('click', ()=>{ if(currentPage<totalPages){ currentPage++; refreshUI(); }});

  // exports
  function toCsv(rows){
    const headers = ['employee_id','name','position','phone','email','date_joined','address'];
    const lines = [headers.join(',')];
    for(const r of rows){
      const vals = headers.map(h => `"${String(r[h]||'').replace(/"/g,'""')}"`);
      lines.push(vals.join(','));
    }
    return lines.join('\n');
  }

  exportCsvBtn && exportCsvBtn.addEventListener('click', async () => {
    const data = await loadAllData();
    if(!data.length) return alert('Tidak ada data untuk diekspor.');
    const csv = toCsv(data);
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'employees.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  exportXlsBtn && exportXlsBtn.addEventListener('click', async () => {
    const data = await loadAllData();
    if(!data.length) return alert('Tidak ada data untuk diekspor.');
    const ws_data = [['NIK','Nama','Jabatan','Telepon','Email','Tanggal Bergabung','Alamat']];
    for(const r of data) ws_data.push([r.employee_id,r.name,r.position,r.phone,r.email,r.date_joined,r.address]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'employees.xlsx');
  });

  exportPdfBtn && exportPdfBtn.addEventListener('click', async () => {
    const data = await loadAllData();
    if(!data.length) return alert('Tidak ada data untuk diekspor.');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'pt', format:'a4' });
    const rows = data.map(r => [r.employee_id, r.name, r.position, r.phone, r.date_joined || '-' ]);
    doc.text('Data Karyawan', 40, 40);
    doc.autoTable({
      head: [['NIK','Nama','Jabatan','Telepon','Tgl Bergabung']],
      body: rows,
      startY: 60,
      styles: { fontSize:9 }
    });
    doc.save('employees.pdf');
  });

  // setActiveTab
  function setActiveTab(name){
    tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    Object.keys(tabElems).forEach(k => tabElems[k].style.display = (k === name ? 'block' : 'none'));
  }
  tabs.forEach(b => b.addEventListener('click', ()=> setActiveTab(b.dataset.tab)));

  // initial seed for localStorage if empty (optional)
  async function ensureSeed(){
    if(window.USE_API) return;
    const list = await loadAllData();
    if(!list || list.length === 0){
      const sample = [
        { employee_id:'EMP-001', name:'Siti Aminah', position:'Staff', phone:'081234567890', email:'siti@example.com', date_joined:'2023-01-15', address:'Jakarta' },
        { employee_id:'EMP-002', name:'Budi Santoso', position:'Supervisor', phone:'081298765432', email:'budi@example.com', date_joined:'2024-05-01', address:'Bandung' },
        { employee_id:'EMP-003', name:'Rina Wijaya', position:'Manager', phone:'081355512345', email:'rina@example.com', date_joined:'2022-09-10', address:'Surabaya' }
      ];
      for(const s of sample) await createEmployee(s);
    }
  }

  // --- API wrappers for localStorage path are in apiRequest above ---
  // ensure helper createEmployee/updateEmployee/deleteEmployeeAPI/loadAll are available in closure
  async function init(){
    await ensureSeed();
    await refreshUI();
  }

  init();

  // expose small helpers for edit start (used in delegation earlier)
  window.startEdit = startEdit;

})();
