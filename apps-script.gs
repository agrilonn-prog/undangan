// Google Apps Script untuk undangan: dinding ucapan bersama + pesanan (mode bisnis).
// Tempel di Sheet > Ekstensi > Apps Script, lalu Terapkan > Aplikasi web (akses: Siapa saja).
// Setelah kode diubah: Terapkan > Kelola deployment > ikon pensil > Versi baru > Terapkan.
//
// Pesanan: tab "pesanan" dibuat otomatis. Kolom status berisi menunggu / lunas / batal.
// Setelah pembayaran diterima, ubah status pesanan menjadi "lunas" (ada menu pilihan di sel).

var S_PESANAN = 'pesanan', S_UCAPAN = 'ucapan';

function aman(x) { x = String(x); return /^[=+\-@]/.test(x) ? "'" + x : x; }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function sheetPesanan() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), s = ss.getSheetByName(S_PESANAN);
  if (!s) {
    s = ss.insertSheet(S_PESANAN);
    s.appendRow(['id', 'waktu', 'status', 'paket', 'kontak', 'token', 'data', 'catatan']);
    s.setFrozenRows(1);
    s.getRange('C2:C2000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['menunggu', 'lunas', 'batal'], true).build());
  }
  return s;
}
function cari(s, id) {
  var v = s.getRange(1, 1, Math.max(s.getLastRow(), 1), 1).getValues();
  for (var i = 1; i < v.length; i++) { if (String(v[i][0]) === id) return i + 1; }
  return 0;
}

function doPost(e) {
  var b; try { b = JSON.parse(e.postData.contents); } catch (x) { return json({ok: false}); }
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    if (b.aksi === 'pesan' || b.aksi === 'ubah') {
      var id = String(b.id || ''), tk = String(b.tk || '');
      if (!/^[A-Z0-9]{6}$/.test(id) || !/^[A-Za-z0-9]{12,64}$/.test(tk)) return json({ok: false, e: 'id'});
      var data = JSON.stringify(b.data || {}); if (data.length > 40000) return json({ok: false, e: 'besar'});
      var s = sheetPesanan(), r = cari(s, id);
      if (b.aksi === 'pesan') {
        if (r) return json({ok: false, e: 'ada'});
        s.appendRow([id, new Date(), 'menunggu', aman(String(b.paket || '').slice(0, 30)), aman(String(b.kontak || '').slice(0, 20)), tk, data, '']);
        return json({ok: true});
      }
      if (!r) return json({ok: false, e: 'tidak ada'});
      if (String(s.getRange(r, 6).getValue()) !== tk) return json({ok: false, e: 'token'});
      s.getRange(r, 7).setValue(data);
      return json({ok: true});
    }
    // Ucapan tamu
    var ss = SpreadsheetApp.getActiveSpreadsheet(), u = ss.getSheetByName(S_UCAPAN) || ss.insertSheet(S_UCAPAN);
    u.appendRow([new Date(), aman(String(b.key).slice(0, 200)), aman(String(b.n).slice(0, 60)), aman(String(b.h).slice(0, 20)), Number(b.jm) || 0, aman(String(b.t).slice(0, 500))]);
    return ContentService.createTextOutput('ok');
  } finally { lock.releaseLock(); }
}

function doGet(e) {
  var p = e.parameter || {}, ss = SpreadsheetApp.getActiveSpreadsheet();
  if (p.pesanan) {
    var s = ss.getSheetByName(S_PESANAN);
    if (s) {
      var r = cari(s, String(p.pesanan));
      if (r) {
        var v = s.getRange(r, 1, 1, 7).getValues()[0], d = {};
        try { d = JSON.parse(v[6]); } catch (x) {}
        return json({ok: true, status: String(v[2]).trim().toLowerCase(), paket: String(v[3]).replace(/^'/, ''), data: d});
      }
    }
    return json({ok: false});
  }
  var u = ss.getSheetByName(S_UCAPAN), out = [];
  if (u) {
    var rows = u.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 0 && out.length < 50; i--) {
      if (String(rows[i][1]).replace(/^'/, '') == p.key) out.push({n: rows[i][2], h: rows[i][3], t: rows[i][5]});
    }
  }
  return json(out);
}
