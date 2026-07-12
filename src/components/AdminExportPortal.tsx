import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  Calendar, 
  Wallet, 
  Clock, 
  BookOpen, 
  Award,
  Sparkles,
  School,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  ClipboardList,
  FileCode,
  Copy,
  Check
} from 'lucide-react';
import { Student, AttendanceDay, CashRecord, PiketGroup, AgendaItem, ScheduleItem, GradeItem, TeacherAccount, AttendanceStatus } from '../types';
import { jsPDF } from 'jspdf';

interface AdminExportPortalProps {
  currentUser: TeacherAccount;
  teachers: TeacherAccount[];
  activeClassTeacherId: string;
}

export default function AdminExportPortal({
  currentUser,
  teachers,
  activeClassTeacherId,
}: AdminExportPortalProps) {
  // Lists of teachers who manage a class
  const classTeachers = teachers.filter(t => t.role === 'teacher');
  
  // State for which class is selected for export (Admin only)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    currentUser.role === 'admin' 
      ? (classTeachers[0]?.id || 't_siti') 
      : activeClassTeacherId
  );

  // Load the target class data on demand from local storage
  const getSelectedClassData = () => {
    const prefix = currentUser.role === 'admin' ? selectedTeacherId : activeClassTeacherId;
    const teacher = teachers.find(t => t.id === prefix) || currentUser;

    const savedInfo = localStorage.getItem(`class_info_${prefix}`);
    const savedStudents = localStorage.getItem(`class_students_${prefix}`);
    const savedAttendance = localStorage.getItem(`class_attendance_${prefix}`);
    const savedCash = localStorage.getItem(`class_cash_${prefix}`);
    const savedPiket = localStorage.getItem(`class_piket_${prefix}`);
    const savedAgendas = localStorage.getItem(`class_agendas_${prefix}`);
    const savedSchedules = localStorage.getItem(`class_schedules_${prefix}`);
    const savedGrades = localStorage.getItem(`class_grades_${prefix}`);

    const classInfo = savedInfo ? JSON.parse(savedInfo) : { className: teacher.className, schoolName: 'SD Negeri Cimandirasa', academicYear: '2026/2027' };
    const students: Student[] = savedStudents ? JSON.parse(savedStudents) : [];
    const attendance: AttendanceDay[] = savedAttendance ? JSON.parse(savedAttendance) : [];
    const cash: CashRecord[] = savedCash ? JSON.parse(savedCash) : [];
    const piket: PiketGroup[] = savedPiket ? JSON.parse(savedPiket) : [];
    const agendas: AgendaItem[] = savedAgendas ? JSON.parse(savedAgendas) : [];
    const schedules: ScheduleItem[] = savedSchedules ? JSON.parse(savedSchedules) : [];
    const grades: GradeItem[] = savedGrades ? JSON.parse(savedGrades) : [];

    return { teacher, classInfo, students, attendance, cash, piket, agendas, schedules, grades };
  };

  const { teacher, classInfo, students, attendance, cash, piket, agendas, schedules, grades } = getSelectedClassData();

  const [gasCopied, setGasCopied] = useState(false);

  const generateAppsScriptCode = () => {
    const escapedClassName = classInfo.className.replace(/"/g, '\\"');
    const escapedTeacherName = teacher.name.replace(/"/g, '\\"');
    const escapedSchoolName = (classInfo.schoolName || 'SD Negeri Cimandirasa').replace(/"/g, '\\"');
    const escapedAcademicYear = (classInfo.academicYear || '2026/2027').replace(/"/g, '\\"');

    const code = `/**
 * =========================================================================
 * SCRIPT OTOMATISASI REKAP PORTAL E-ADMINISTRASI SEKOLAH
 * =========================================================================
 * Pengembang: SDN Cimandirasa Portal Integrator
 * Kelas: ${escapedClassName}
 * Wali Kelas: ${escapedTeacherName}
 * Tahun Ajaran: ${escapedAcademicYear}
 * Dibuat Pada: ${new Date().toLocaleDateString('id-ID')}
 * 
 * PETUNJUK PEMASANGAN DI SCRIPT.GOOGLE.COM:
 * 1. Buka spreadsheet baru di Google Sheets (https://sheets.google.com)
 * 2. Klik menu "Extensions" (Ekstensi) > "Apps Script"
 * 3. Hapus seluruh kode bawaan yang ada di editor (function myFunction() {}).
 * 4. Salin dan tempel (paste) seluruh kode script di bawah ini ke editor.
 * 5. Klik ikon simpan (ikon disket) atau tekan Ctrl+S / Cmd+S.
 * 6. Klik tombol "Run" (Jalankan) dengan fungsi terpilih "setupPortalSheets".
 * 7. Setujui permintaan otorisasi izin dari Google (klik Advanced > Go to... > Allow).
 * 8. Kembali ke Google Sheets, Anda akan melihat menu baru "Portal e-Administrasi"
 *    dan 7 tab lembar kerja yang terisi rapi secara otomatis!
 * =========================================================================
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Portal e-Administrasi')
    .addItem('🚀 Inisialisasi & Impor Semua Data', 'setupPortalSheets')
    .addItem('🎨 Rapikan Format Visual Tabel', 'formatSheetsOnly')
    .addToUi();
}

function setupPortalSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  
  // Set nama sheet pertama jika masih default "Sheet1"
  if (sheets.length === 1 && sheets[0].getName() === "Sheet1") {
    sheets[0].setName("1. Daftar Siswa");
  }

  var schoolName = "${escapedSchoolName}";
  var className = "${escapedClassName}";
  var teacherName = "${escapedTeacherName}";
  var academicYear = "${escapedAcademicYear}";

  // ==========================================
  // 1. LEMBAR DATA SISWA
  // ==========================================
  var sheetSiswa = ss.getSheetByName("1. Daftar Siswa") || ss.insertSheet("1. Daftar Siswa");
  sheetSiswa.clear();
  sheetSiswa.getRange("A1").setValue("DAFTAR REKAPITULASI DATA SISWA").setFontSize(14).setFontWeight("bold");
  sheetSiswa.getRange("A2").setValue(schoolName + " | Kelas: " + className + " | Wali Kelas: " + teacherName + " | TA: " + academicYear).setFontSize(9).setFontColor("#4b5563");
  
  var headersSiswa = ["No", "Nama Siswa", "NISN", "Gender", "Orang Tua / Wali", "No. Telepon", "Status"];
  sheetSiswa.getRange(4, 1, 1, headersSiswa.length).setValues([headersSiswa])
    .setBackground("#4f46e5")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
    
  var studentsData = ${JSON.stringify(students, null, 2)};
  var rowsSiswa = [];
  for (var i = 0; i < studentsData.length; i++) {
    var s = studentsData[i];
    rowsSiswa.push([
      i + 1,
      s.name,
      s.nisn || "-",
      s.gender === "L" ? "Laki-laki" : "Perempuan",
      s.parentName || "-",
      s.phone || "-",
      s.status.toUpperCase()
    ]);
  }
  if (rowsSiswa.length > 0) {
    sheetSiswa.getRange(5, 1, rowsSiswa.length, headersSiswa.length).setValues(rowsSiswa);
    for (var r = 0; r < rowsSiswa.length; r++) {
      var rowNum = 5 + r;
      if (r % 2 === 1) sheetSiswa.getRange(rowNum, 1, 1, headersSiswa.length).setBackground("#f9fafb");
      sheetSiswa.getRange(rowNum, 1).setHorizontalAlignment("center");
      sheetSiswa.getRange(rowNum, 3).setHorizontalAlignment("center");
      sheetSiswa.getRange(rowNum, 4).setHorizontalAlignment("center");
      sheetSiswa.getRange(rowNum, 7).setHorizontalAlignment("center");
    }
    sheetSiswa.getRange(4, 1, rowsSiswa.length + 1, headersSiswa.length).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  }
  sheetSiswa.getRange("A:G").setFontFamily("Arial").setVerticalAlignment("middle");
  sheetSiswa.setColumnWidths(1, 7, [40, 180, 100, 80, 160, 120, 90]);

  // ==========================================
  // 2. LEMBAR PRESENSI HARIAN
  // ==========================================
  var sheetPresensi = ss.getSheetByName("2. Rekap Presensi") || ss.insertSheet("2. Rekap Presensi");
  sheetPresensi.clear();
  sheetPresensi.getRange("A1").setValue("REKAPITULASI PRESENSI KEHADIRAN SISWA").setFontSize(14).setFontWeight("bold");
  sheetPresensi.getRange("A2").setValue(schoolName + " | Kelas: " + className + " | TA: " + academicYear).setFontSize(9).setFontColor("#4b5563");
  
  var headersPresensi = ["No", "Nama Siswa", "Hadir (H)", "Sakit (S)", "Izin (I)", "Alpa (A)", "Total Hari KBM", "Rasio Kehadiran"];
  sheetPresensi.getRange(4, 1, 1, headersPresensi.length).setValues([headersPresensi])
    .setBackground("#10b981")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
    
  var attendanceData = ${JSON.stringify(attendance, null, 2)};
  var summary = {};
  for (var k = 0; k < studentsData.length; k++) {
    summary[studentsData[k].id] = { H: 0, S: 0, I: 0, A: 0, total: 0 };
  }
  for (var d = 0; d < attendanceData.length; d++) {
    var records = attendanceData[d].records || {};
    for (var sid in records) {
      if (summary[sid]) {
        summary[sid][records[sid]]++;
        summary[sid].total++;
      }
    }
  }
  
  var rowsPresensi = [];
  for (var i = 0; i < studentsData.length; i++) {
    var s = studentsData[i];
    var stat = summary[s.id] || { H: 0, S: 0, I: 0, A: 0, total: 0 };
    var rate = stat.total > 0 ? Math.round((stat.H / stat.total) * 100) : 100;
    rowsPresensi.push([
      i + 1,
      s.name,
      stat.H,
      stat.S,
      stat.I,
      stat.A,
      stat.total,
      rate + "%"
    ]);
  }
  if (rowsPresensi.length > 0) {
    sheetPresensi.getRange(5, 1, rowsPresensi.length, headersPresensi.length).setValues(rowsPresensi);
    for (var r = 0; r < rowsPresensi.length; r++) {
      var rowNum = 5 + r;
      if (r % 2 === 1) sheetPresensi.getRange(rowNum, 1, 1, headersPresensi.length).setBackground("#f9fafb");
      sheetPresensi.getRange(rowNum, 1).setHorizontalAlignment("center");
      sheetPresensi.getRange(rowNum, 3, 1, 6).setHorizontalAlignment("center");
    }
    sheetPresensi.getRange(4, 1, rowsPresensi.length + 1, headersPresensi.length).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  }
  sheetPresensi.getRange("A:H").setFontFamily("Arial").setVerticalAlignment("middle");
  sheetPresensi.setColumnWidths(1, 8, [40, 180, 80, 80, 80, 80, 90, 140]);

  // ==========================================
  // 3. LEMBAR BUKU KAS KELAS
  // ==========================================
  var sheetKas = ss.getSheetByName("3. Buku Kas Kelas") || ss.insertSheet("3. Buku Kas Kelas");
  sheetKas.clear();
  sheetKas.getRange("A1").setValue("BUKU REGISTRASI KEUANGAN KAS KELAS").setFontSize(14).setFontWeight("bold");
  sheetKas.getRange("A2").setValue(schoolName + " | Kelas: " + className + " | TA: " + academicYear).setFontSize(9).setFontColor("#4b5563");
  
  var headersKas = ["No", "Tanggal", "Jenis", "Kategori", "Keterangan", "Jumlah Rupiah"];
  sheetKas.getRange(4, 1, 1, headersKas.length).setValues([headersKas])
    .setBackground("#6366f1")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
    
  var cashData = ${JSON.stringify(cash, null, 2)};
  var rowsKas = [];
  for (var i = 0; i < cashData.length; i++) {
    var c = cashData[i];
    rowsKas.push([
      i + 1,
      c.date,
      c.type.toUpperCase(),
      c.category,
      c.description,
      c.amount
    ]);
  }
  if (rowsKas.length > 0) {
    sheetKas.getRange(5, 1, rowsKas.length, headersKas.length).setValues(rowsKas);
    for (var r = 0; r < rowsKas.length; r++) {
      var rowNum = 5 + r;
      if (r % 2 === 1) sheetKas.getRange(rowNum, 1, 1, headersKas.length).setBackground("#f9fafb");
      sheetKas.getRange(rowNum, 1).setHorizontalAlignment("center");
      sheetKas.getRange(rowNum, 2).setHorizontalAlignment("center");
      sheetKas.getRange(rowNum, 3).setHorizontalAlignment("center");
      
      var typeCell = sheetKas.getRange(rowNum, 3);
      if (typeCell.getValue() === "MASUK") {
        typeCell.setFontColor("#10b981").setFontWeight("bold");
      } else {
        typeCell.setFontColor("#ef4444").setFontWeight("bold");
      }
      sheetKas.getRange(rowNum, 6).setNumberFormat('"Rp"#,##0');
    }
    sheetKas.getRange(4, 1, rowsKas.length + 1, headersKas.length).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  }
  sheetKas.getRange("A:F").setFontFamily("Arial").setVerticalAlignment("middle");
  sheetKas.setColumnWidths(1, 6, [40, 90, 80, 110, 180, 120]);

  // ==========================================
  // 4. LEMBAR JADWAL PELAJARAN
  // ==========================================
  var sheetJadwal = ss.getSheetByName("4. Jadwal Pelajaran") || ss.insertSheet("4. Jadwal Pelajaran");
  sheetJadwal.clear();
  sheetJadwal.getRange("A1").setValue("JADWAL KEGIATAN BELAJAR MENGAJAR (KBM)").setFontSize(14).setFontWeight("bold");
  sheetJadwal.getRange("A2").setValue(schoolName + " | Kelas: " + className + " | TA: " + academicYear).setFontSize(9).setFontColor("#4b5563");
  
  var headersJadwal = ["No", "Hari", "Alokasi Waktu", "Mata Pelajaran", "Guru Pengampu"];
  sheetJadwal.getRange(4, 1, 1, headersJadwal.length).setValues([headersJadwal])
    .setBackground("#8b5cf6")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
    
  var schedulesData = ${JSON.stringify(schedules, null, 2)};
  var rowsJadwal = [];
  for (var i = 0; i < schedulesData.length; i++) {
    var s = schedulesData[i];
    rowsJadwal.push([
      i + 1,
      s.day,
      s.startTime + " - " + s.endTime,
      s.subject,
      s.teacher
    ]);
  }
  if (rowsJadwal.length > 0) {
    sheetJadwal.getRange(5, 1, rowsJadwal.length, headersJadwal.length).setValues(rowsJadwal);
    for (var r = 0; r < rowsJadwal.length; r++) {
      var rowNum = 5 + r;
      if (r % 2 === 1) sheetJadwal.getRange(rowNum, 1, 1, headersJadwal.length).setBackground("#f9fafb");
      sheetJadwal.getRange(rowNum, 1).setHorizontalAlignment("center");
      sheetJadwal.getRange(rowNum, 2).setHorizontalAlignment("center").setFontWeight("bold");
      sheetJadwal.getRange(rowNum, 3).setHorizontalAlignment("center");
    }
    sheetJadwal.getRange(4, 1, rowsJadwal.length + 1, headersJadwal.length).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  }
  sheetJadwal.getRange("A:E").setFontFamily("Arial").setVerticalAlignment("middle");
  sheetJadwal.setColumnWidths(1, 5, [40, 90, 110, 160, 150]);

  // ==========================================
  // 5. LEMBAR AGENDA & TUGAS
  // ==========================================
  var sheetAgenda = ss.getSheetByName("5. Agenda & Tugas") || ss.insertSheet("5. Agenda & Tugas");
  sheetAgenda.clear();
  sheetAgenda.getRange("A1").setValue("BUKU AGENDA KEGIATAN & TUGAS KELAS").setFontSize(14).setFontWeight("bold");
  sheetAgenda.getRange("A2").setValue(schoolName + " | Kelas: " + className + " | TA: " + academicYear).setFontSize(9).setFontColor("#4b5563");
  
  var headersAgenda = ["No", "Tanggal", "Tipe", "Judul Agenda / Tugas", "Deskripsi Catatan Kegiatan"];
  sheetAgenda.getRange(4, 1, 1, headersAgenda.length).setValues([headersAgenda])
    .setBackground("#3b82f6")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
    
  var agendasData = ${JSON.stringify(agendas, null, 2)};
  var rowsAgenda = [];
  for (var i = 0; i < agendasData.length; i++) {
    var a = agendasData[i];
    rowsAgenda.push([
      i + 1,
      a.date,
      a.type.toUpperCase(),
      a.title,
      a.content
    ]);
  }
  if (rowsAgenda.length > 0) {
    sheetAgenda.getRange(5, 1, rowsAgenda.length, headersAgenda.length).setValues(rowsAgenda);
    for (var r = 0; r < rowsAgenda.length; r++) {
      var rowNum = 5 + r;
      if (r % 2 === 1) sheetAgenda.getRange(rowNum, 1, 1, headersAgenda.length).setBackground("#f9fafb");
      sheetAgenda.getRange(rowNum, 1).setHorizontalAlignment("center");
      sheetAgenda.getRange(rowNum, 2).setHorizontalAlignment("center");
      sheetAgenda.getRange(rowNum, 3).setHorizontalAlignment("center").setFontWeight("bold");
    }
    sheetAgenda.getRange(4, 1, rowsAgenda.length + 1, headersAgenda.length).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  }
  sheetAgenda.getRange("A:E").setFontFamily("Arial").setVerticalAlignment("middle");
  sheetAgenda.setColumnWidths(1, 5, [40, 90, 80, 160, 260]);

  // ==========================================
  // 6. LEMBAR ROSTER PIKET HARIAN
  // ==========================================
  var sheetPiket = ss.getSheetByName("6. Roster Piket Harian") || ss.insertSheet("6. Roster Piket Harian");
  sheetPiket.clear();
  sheetPiket.getRange("A1").setValue("JADWAL PIKET KEBERSIHAN HARIAN KELAS").setFontSize(14).setFontWeight("bold");
  sheetPiket.getRange("A2").setValue(schoolName + " | Kelas: " + className + " | TA: " + academicYear).setFontSize(9).setFontColor("#4b5563");
  
  var headersPiket = ["No", "Hari Piket", "Daftar Nama Anggota Regu Piket"];
  sheetPiket.getRange(4, 1, 1, headersPiket.length).setValues([headersPiket])
    .setBackground("#f59e0b")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
    
  var piketData = ${JSON.stringify(piket, null, 2)};
  var studentMap = {};
  for (var k = 0; k < studentsData.length; k++) {
    studentMap[studentsData[k].id] = studentsData[k].name;
  }
  
  var rowsPiket = [];
  for (var i = 0; i < piketData.length; i++) {
    var p = piketData[i];
    var namesList = [];
    if (p.studentIds) {
      for (var sIdx = 0; sIdx < p.studentIds.length; sIdx++) {
        var sName = studentMap[p.studentIds[sIdx]];
        if (sName) namesList.push(sName);
      }
    }
    rowsPiket.push([
      i + 1,
      p.day,
      namesList.join(", ") || "-"
    ]);
  }
  if (rowsPiket.length > 0) {
    sheetPiket.getRange(5, 1, rowsPiket.length, headersPiket.length).setValues(rowsPiket);
    for (var r = 0; r < rowsPiket.length; r++) {
      var rowNum = 5 + r;
      if (r % 2 === 1) sheetPiket.getRange(rowNum, 1, 1, headersPiket.length).setBackground("#f9fafb");
      sheetPiket.getRange(rowNum, 1).setHorizontalAlignment("center");
      sheetPiket.getRange(rowNum, 2).setHorizontalAlignment("center").setFontWeight("bold");
    }
    sheetPiket.getRange(4, 1, rowsPiket.length + 1, headersPiket.length).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  }
  sheetPiket.getRange("A:C").setFontFamily("Arial").setVerticalAlignment("middle");
  sheetPiket.setColumnWidths(1, 3, [40, 100, 360]);

  // ==========================================
  // 7. LEMBAR REKAP NILAI SISWA
  // ==========================================
  var sheetNilai = ss.getSheetByName("7. Rekap Nilai & e-Rapor") || ss.insertSheet("7. Rekap Nilai & e-Rapor");
  sheetNilai.clear();
  sheetNilai.getRange("A1").setValue("DAFTAR REKAPITULASI NILAI AKADEMIS SISWA").setFontSize(14).setFontWeight("bold");
  sheetNilai.getRange("A2").setValue(schoolName + " | Kelas: " + className + " | TA: " + academicYear).setFontSize(9).setFontColor("#4b5563");
  
  var gradesData = ${JSON.stringify(grades, null, 2)};
  var headersNilai = ["No", "Nama Siswa"];
  for (var gIdx = 0; gIdx < gradesData.length; gIdx++) {
    headersNilai.push(gradesData[gIdx].subject + "\\n(" + gradesData[gIdx].title + ")");
  }
  headersNilai.push("Rata-Rata");
  
  sheetNilai.getRange(4, 1, 1, headersNilai.length).setValues([headersNilai])
    .setBackground("#4f46e5")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
    
  var rowsNilai = [];
  for (var i = 0; i < studentsData.length; i++) {
    var s = studentsData[i];
    var row = [i + 1, s.name];
    var scoreSum = 0;
    var scoreCount = 0;
    for (var gIdx = 0; gIdx < gradesData.length; gIdx++) {
      var score = gradesData[gIdx].scores[s.id];
      if (score !== undefined && score !== null) {
        row.push(score);
        scoreSum += score;
        scoreCount++;
      } else {
        row.push("-");
      }
    }
    var avg = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;
    row.push(avg);
    rowsNilai.push(row);
  }
  if (rowsNilai.length > 0) {
    sheetNilai.getRange(5, 1, rowsNilai.length, headersNilai.length).setValues(rowsNilai);
    for (var r = 0; r < rowsNilai.length; r++) {
      var rowNum = 5 + r;
      if (r % 2 === 1) sheetNilai.getRange(rowNum, 1, 1, headersNilai.length).setBackground("#f9fafb");
      sheetNilai.getRange(rowNum, 1).setHorizontalAlignment("center");
      sheetNilai.getRange(rowNum, 3, 1, headersNilai.length - 2).setHorizontalAlignment("center");
      sheetNilai.getRange(rowNum, headersNilai.length).setFontWeight("bold");
    }
    sheetNilai.getRange(4, 1, rowsNilai.length + 1, headersNilai.length).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  }
  sheetNilai.getRange("A:" + String.fromCharCode(65 + headersNilai.length)).setFontFamily("Arial").setVerticalAlignment("middle");
  
  sheetNilai.setColumnWidth(1, 40);
  sheetNilai.setColumnWidth(2, 180);
  for (var cNum = 3; cNum <= headersNilai.length; cNum++) {
    sheetNilai.setColumnWidth(cNum, 100);
  }

  // Aktifkan sheet pertama kembali
  ss.setActiveSheet(sheetSiswa);
  SpreadsheetApp.getUi().alert("🎉 Integrasi Berhasil! Seluruh data e-Administrasi Kelas " + className + " telah diimpor dengan visual yang rapi.");
}

function formatSheetsOnly() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow > 3 && lastCol > 0) {
      sheet.autoResizeColumns(1, lastCol);
      sheet.getRange(1, 1, lastRow, lastCol).setFontFamily("Arial");
    }
  }
  SpreadsheetApp.getUi().alert("🎨 Format visual tabel berhasil dirapikan!");
}
`;
    return code;
  };

  const handleCopyCode = () => {
    const code = generateAppsScriptCode();
    navigator.clipboard.writeText(code);
    setGasCopied(true);
    setTimeout(() => setGasCopied(false), 2000);
  };

  const handleDownloadCodeFile = () => {
    const code = generateAppsScriptCode();
    const blob = new Blob([code], { type: 'text/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GoogleAppsScript_Sync_Kelas_${classInfo.className.replace(/\s+/g, '_')}.gs`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: CSV Generator and Trigger
  const triggerCsvDownload = (filename: string, headers: string[], rows: string[][]) => {
    // UTF-8 BOM to ensure Indonesian characters are rendered correctly in Excel
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: PDF standard styling generator
  const initPdfDoc = (title: string, className: string, academicYear: string) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    // Draw Header border
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(15, 12, 180, 0.5, 'F');
    
    // School Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.text('SD NEGERI CIMANDIRASA', 15, 20);
    
    // Sub-title
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(75, 85, 99); // Gray-600
    doc.text(`Administrasi: ${title} | Kelas: ${className} | Tahun Ajaran: ${academicYear}`, 15, 25);
    
    // Divider
    doc.setDrawColor(209, 213, 219);
    doc.line(15, 28, 195, 28);
    
    return doc;
  };

  // --- EXPORTS IMPLEMENTATION ---

  // 1. DAFTAR SISWA
  const exportSiswaExcel = () => {
    const headers = ['No', 'Nama Siswa', 'NISN', 'Gender', 'Orang Tua / Wali', 'No. Telepon', 'Status'];
    const rows = students.map((s, idx) => [
      String(idx + 1),
      s.name,
      s.nisn,
      s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      s.parentName,
      s.phone,
      s.status.toUpperCase()
    ]);
    triggerCsvDownload(`Daftar_Siswa_${classInfo.className.replace(/\s+/g, '_')}`, headers, rows);
  };

  const exportSiswaPdf = () => {
    const doc = initPdfDoc('DAFTAR REKAPITULASI DATA SISWA', classInfo.className, classInfo.academicYear);
    
    // Table Header
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(15, 35, 180, 8, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('NO', 18, 40);
    doc.text('NAMA LENGKAP SISWA', 27, 40);
    doc.text('NISN', 90, 40);
    doc.text('L/P', 115, 40);
    doc.text('NAMA WALI / ORANG TUA', 130, 40);
    doc.text('STATUS', 180, 40);

    let currentY = 47;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(17, 24, 39);

    students.forEach((s, idx) => {
      // Check page break
      if (currentY > 270) {
        doc.addPage();
        doc.setFillColor(79, 70, 229);
        doc.rect(15, 15, 180, 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('NO', 18, 20);
        doc.text('NAMA LENGKAP SISWA', 27, 20);
        doc.text('NISN', 90, 20);
        doc.text('L/P', 115, 20);
        doc.text('NAMA WALI / ORANG TUA', 130, 20);
        doc.text('STATUS', 180, 20);
        currentY = 27;
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
      }

      // Zebra stripes
      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251); // Gray-50
        doc.rect(15, currentY - 4, 180, 6, 'F');
      }

      doc.text(String(idx + 1), 18, currentY);
      doc.text(s.name, 27, currentY);
      doc.text(s.nisn, 90, currentY);
      doc.text(s.gender, 115, currentY);
      doc.text(s.parentName, 130, currentY);
      doc.text(s.status.toUpperCase(), 180, currentY);

      currentY += 6;
    });

    // Signatures
    currentY += 15;
    if (currentY < 250) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Mengetahui,', 20, currentY);
      doc.text('Kepala Sekolah SDN Cimandirasa', 20, currentY + 5);
      doc.text('Haji Mulyono, M.Pd.', 20, currentY + 25);

      doc.text('Wali Kelas Pengampu,', 140, currentY);
      doc.text(teacher.name, 140, currentY + 25);
    }

    doc.save(`Administrasi_Daftar_Siswa_${classInfo.className.replace(/\s+/g, '_')}.pdf`);
  };

  // 2. PRESENSI HARIAN
  const exportPresensiExcel = () => {
    // Generate historical metrics
    const summary: { [id: string]: { H: number; S: number; I: number; A: number; total: number } } = {};
    students.forEach(s => { summary[s.id] = { H: 0, S: 0, I: 0, A: 0, total: 0 }; });
    
    attendance.forEach(day => {
      Object.entries(day.records).forEach(([id, status]) => {
        if (summary[id]) {
          summary[id][status]++;
          summary[id].total++;
        }
      });
    });

    const headers = ['No', 'Nama Siswa', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alpa (A)', 'Total Hari', 'Rasio Kehadiran (%)'];
    const rows = students.map((s, idx) => {
      const stat = summary[s.id] || { H: 0, S: 0, I: 0, A: 0, total: 0 };
      const rate = stat.total > 0 ? Math.round((stat.H / stat.total) * 100) : 100;
      return [
        String(idx + 1),
        s.name,
        String(stat.H),
        String(stat.S),
        String(stat.I),
        String(stat.A),
        String(stat.total),
        `${rate}%`
      ];
    });

    triggerCsvDownload(`Rekap_Presensi_${classInfo.className.replace(/\s+/g, '_')}`, headers, rows);
  };

  const exportPresensiPdf = () => {
    const doc = initPdfDoc('REKAPITULASI PRESENSI KEHADIRAN SISWA', classInfo.className, classInfo.academicYear);
    
    // Calc stats
    const summary: { [id: string]: { H: number; S: number; I: number; A: number; total: number } } = {};
    students.forEach(s => { summary[s.id] = { H: 0, S: 0, I: 0, A: 0, total: 0 }; });
    
    attendance.forEach(day => {
      Object.entries(day.records).forEach(([id, status]) => {
        if (summary[id]) {
          summary[id][status]++;
          summary[id].total++;
        }
      });
    });

    // Table Header
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(15, 35, 180, 8, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('NO', 18, 40);
    doc.text('NAMA LENGKAP SISWA', 27, 40);
    doc.text('HADIR (H)', 100, 40);
    doc.text('SAKIT (S)', 120, 40);
    doc.text('IZIN (I)', 140, 40);
    doc.text('ALPA (A)', 160, 40);
    doc.text('RASIO (%)', 180, 40);

    let currentY = 47;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(17, 24, 39);

    students.forEach((s, idx) => {
      if (currentY > 270) {
        doc.addPage();
        doc.setFillColor(16, 185, 129);
        doc.rect(15, 15, 180, 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('NO', 18, 20);
        doc.text('NAMA LENGKAP SISWA', 27, 20);
        doc.text('HADIR (H)', 100, 20);
        doc.text('SAKIT (S)', 120, 20);
        doc.text('IZIN (I)', 140, 20);
        doc.text('ALPA (A)', 160, 20);
        doc.text('RASIO (%)', 180, 20);
        currentY = 27;
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(15, currentY - 4, 180, 6, 'F');
      }

      const stat = summary[s.id] || { H: 0, S: 0, I: 0, A: 0, total: 0 };
      const rate = stat.total > 0 ? Math.round((stat.H / stat.total) * 100) : 100;

      doc.text(String(idx + 1), 18, currentY);
      doc.text(s.name, 27, currentY);
      doc.text(String(stat.H), 100, currentY);
      doc.text(String(stat.S), 120, currentY);
      doc.text(String(stat.I), 140, currentY);
      doc.text(String(stat.A), 160, currentY);
      doc.text(`${rate}%`, 180, currentY);

      currentY += 6;
    });

    doc.save(`Administrasi_Presensi_${classInfo.className.replace(/\s+/g, '_')}.pdf`);
  };

  // 3. BUKU KAS KELAS
  const exportKasExcel = () => {
    const headers = ['No', 'Tanggal', 'Jenis Transaksi', 'Kategori', 'Keterangan', 'Jumlah (Rp)'];
    const rows = cash.map((c, idx) => [
      String(idx + 1),
      c.date,
      c.type.toUpperCase(),
      c.category,
      c.description,
      String(c.amount)
    ]);
    triggerCsvDownload(`Buku_Kas_${classInfo.className.replace(/\s+/g, '_')}`, headers, rows);
  };

  const exportKasPdf = () => {
    const doc = initPdfDoc('BUKU REGISTRASI KEUANGAN KAS KELAS', classInfo.className, classInfo.academicYear);
    
    // Header summary card
    const totalMasuk = cash.filter(c => c.type === 'masuk').reduce((sum, c) => sum + c.amount, 0);
    const totalKeluar = cash.filter(c => c.type === 'keluar').reduce((sum, c) => sum + c.amount, 0);
    const saldo = totalMasuk - totalKeluar;

    doc.setFillColor(241, 245, 249);
    doc.rect(15, 33, 180, 18, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(15, 33, 180, 18, 'D');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL PEMASUKAN', 20, 39);
    doc.text('TOTAL PENGELUARAN', 80, 39);
    doc.text('SALDO KAS SAAT INI', 140, 39);

    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129); // green
    doc.text(`Rp ${totalMasuk.toLocaleString('id-ID')}`, 20, 46);
    doc.setTextColor(239, 68, 68); // red
    doc.text(`Rp ${totalKeluar.toLocaleString('id-ID')}`, 80, 46);
    doc.setTextColor(79, 70, 229); // indigo
    doc.text(`Rp ${saldo.toLocaleString('id-ID')}`, 140, 46);

    // Table Header
    doc.setFillColor(79, 70, 229);
    doc.rect(15, 57, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('NO', 18, 62);
    doc.text('TANGGAL', 27, 62);
    doc.text('JENIS', 48, 62);
    doc.text('KATEGORI', 68, 62);
    doc.text('KETERANGAN TRANSKASI', 95, 62);
    doc.text('JUMLAH RUPIAH', 165, 62);

    let currentY = 70;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(17, 24, 39);

    cash.forEach((c, idx) => {
      if (currentY > 270) {
        doc.addPage();
        doc.setFillColor(79, 70, 229);
        doc.rect(15, 15, 180, 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('NO', 18, 20);
        doc.text('TANGGAL', 27, 20);
        doc.text('JENIS', 48, 20);
        doc.text('KATEGORI', 68, 20);
        doc.text('KETERANGAN TRANSKASI', 95, 20);
        doc.text('JUMLAH RUPIAH', 165, 20);
        currentY = 27;
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(15, currentY - 4, 180, 6, 'F');
      }

      doc.text(String(idx + 1), 18, currentY);
      doc.text(c.date, 27, currentY);
      
      doc.setFont('Helvetica', 'bold');
      if (c.type === 'masuk') {
        doc.setTextColor(16, 185, 129);
        doc.text('MASUK', 48, currentY);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text('KELUAR', 48, currentY);
      }
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(17, 24, 39);

      doc.text(c.category, 68, currentY);
      doc.text(c.description, 95, currentY);
      doc.text(`Rp ${c.amount.toLocaleString('id-ID')}`, 165, currentY);

      currentY += 6;
    });

    doc.save(`Administrasi_Buku_Kas_${classInfo.className.replace(/\s+/g, '_')}.pdf`);
  };

  // 4. JADWAL PELAJARAN
  const exportJadwalExcel = () => {
    const headers = ['No', 'Hari', 'Jam Pelajaran', 'Mata Pelajaran', 'Guru Pengampu'];
    const rows = schedules.map((s, idx) => [
      String(idx + 1),
      s.day,
      `${s.startTime} - ${s.endTime}`,
      s.subject,
      s.teacher
    ]);
    triggerCsvDownload(`Jadwal_Pelajaran_${classInfo.className.replace(/\s+/g, '_')}`, headers, rows);
  };

  const exportJadwalPdf = () => {
    const doc = initPdfDoc('JADWAL KEGIATAN BELAJAR MENGAJAR', classInfo.className, classInfo.academicYear);
    
    // Table Header
    doc.setFillColor(99, 102, 241); // Indigo-500
    doc.rect(15, 35, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('NO', 18, 40);
    doc.text('HARI', 27, 40);
    doc.text('ALOKASI WAKTU', 52, 40);
    doc.text('MATA PELAJARAN', 85, 40);
    doc.text('GURU PENGAMPU / PENGAJAR', 135, 40);

    let currentY = 47;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(17, 24, 39);

    schedules.forEach((s, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(15, currentY - 4, 180, 6, 'F');
      }

      doc.text(String(idx + 1), 18, currentY);
      doc.setFont('Helvetica', 'bold');
      doc.text(s.day, 27, currentY);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${s.startTime} - ${s.endTime}`, 52, currentY);
      doc.text(s.subject, 85, currentY);
      doc.text(s.teacher, 135, currentY);

      currentY += 6;
    });

    doc.save(`Administrasi_Jadwal_Pelajaran_${classInfo.className.replace(/\s+/g, '_')}.pdf`);
  };

  // 5. AGENDA & TUGAS
  const exportAgendaExcel = () => {
    const headers = ['No', 'Tanggal', 'Tipe Agenda', 'Judul Agenda', 'Deskripsi'];
    const rows = agendas.map((a, idx) => [
      String(idx + 1),
      a.date,
      a.type.toUpperCase(),
      a.title,
      a.content
    ]);
    triggerCsvDownload(`Agenda_Kegiatan_${classInfo.className.replace(/\s+/g, '_')}`, headers, rows);
  };

  const exportAgendaPdf = () => {
    const doc = initPdfDoc('BUKU AGENDA KEGIATAN & TUGAS MANDIRI', classInfo.className, classInfo.academicYear);
    
    // Table Header
    doc.setFillColor(139, 92, 246); // Violet-500
    doc.rect(15, 35, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('NO', 18, 40);
    doc.text('TANGGAL', 27, 40);
    doc.text('JENIS', 52, 40);
    doc.text('JUDUL AGENDA / TUGAS', 75, 40);
    doc.text('DESKRIPSI LENGKAP / CATATAN', 125, 40);

    let currentY = 47;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(17, 24, 39);

    agendas.forEach((a, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(15, currentY - 4, 180, 6, 'F');
      }

      doc.text(String(idx + 1), 18, currentY);
      doc.text(a.date, 27, currentY);
      
      doc.setFont('Helvetica', 'bold');
      doc.text(a.type.toUpperCase(), 52, currentY);
      doc.setFont('Helvetica', 'normal');

      doc.text(a.title, 75, currentY);
      
      // Limit description length to avoid overlap
      const desc = a.content.length > 55 ? a.content.substring(0, 52) + '...' : a.content;
      doc.text(desc, 125, currentY);

      currentY += 6;
    });

    doc.save(`Administrasi_Agenda_Kelas_${classInfo.className.replace(/\s+/g, '_')}.pdf`);
  };

  // 6. JADWAL PIKET
  const exportPiketExcel = () => {
    const headers = ['No', 'Hari', 'Daftar Nama Anggota Piket'];
    const rows = piket.map((p, idx) => {
      const names = p.studentIds.map(id => students.find(s => s.id === id)?.name || '').filter(Boolean).join(', ');
      return [
        String(idx + 1),
        p.day,
        names
      ];
    });
    triggerCsvDownload(`Jadwal_Piket_${classInfo.className.replace(/\s+/g, '_')}`, headers, rows);
  };

  const exportPiketPdf = () => {
    const doc = initPdfDoc('JADWAL PIKET KEBERSIHAN HARIAN KELAS', classInfo.className, classInfo.academicYear);
    
    // Table Header
    doc.setFillColor(245, 158, 11); // Amber-500
    doc.rect(15, 35, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('NO', 18, 40);
    doc.text('HARI PIKET', 27, 40);
    doc.text('DAFTAR NAMA ANGGOTA REGU PIKET KELAS', 65, 40);

    let currentY = 47;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(17, 24, 39);

    piket.forEach((p, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(15, currentY - 4, 180, 6, 'F');
      }

      const names = p.studentIds.map(id => students.find(s => s.id === id)?.name || '').filter(Boolean).join(', ');

      doc.text(String(idx + 1), 18, currentY);
      doc.setFont('Helvetica', 'bold');
      doc.text(p.day, 27, currentY);
      doc.setFont('Helvetica', 'normal');
      doc.text(names || 'Belum diatur regu piket', 65, currentY);

      currentY += 6;
    });

    doc.save(`Administrasi_Jadwal_Piket_${classInfo.className.replace(/\s+/g, '_')}.pdf`);
  };

  // 7. DATA REKAPITULASI NILAI AKADEMIK
  const exportNilaiExcel = () => {
    // Collect columns names
    const headers = ['No', 'Nama Siswa', ...grades.map(g => `${g.subject} (${g.title})`), 'Rata-Rata'];
    
    const rows = students.map((s, idx) => {
      let scoreSum = 0;
      let count = 0;
      const scoreCols = grades.map(g => {
        const score = g.scores[s.id];
        if (score !== undefined) {
          scoreSum += score;
          count++;
          return String(score);
        }
        return '-';
      });
      const avg = count > 0 ? Math.round(scoreSum / count) : 0;
      return [
        String(idx + 1),
        s.name,
        ...scoreCols,
        String(avg)
      ];
    });

    triggerCsvDownload(`Rekap_Nilai_Akademik_${classInfo.className.replace(/\s+/g, '_')}`, headers, rows);
  };

  const exportNilaiPdf = () => {
    const doc = initPdfDoc('DAFTAR NILAI AKADEMIS DAN EVALUASI BELAJAR', classInfo.className, classInfo.academicYear);
    
    // Draw columns headers
    doc.setFillColor(79, 70, 229);
    doc.rect(15, 35, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('NO', 18, 40);
    doc.text('NAMA LENGKAP SISWA', 27, 40);
    
    // Draw columns for first 3 assessments to avoid page squeeze in standard layout
    const visibleGrades = grades.slice(0, 4);
    visibleGrades.forEach((g, i) => {
      // truncated name
      const subj = g.subject.substring(0, 12);
      doc.text(`${subj}`, 90 + (i * 22), 39);
      doc.setFontSize(6);
      doc.text(`(${g.title.substring(0, 10)})`, 90 + (i * 22), 42);
      doc.setFontSize(8);
    });
    
    doc.text('RATA-RATA', 180, 40);

    let currentY = 47;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(17, 24, 39);

    students.forEach((s, idx) => {
      if (currentY > 270) {
        doc.addPage();
        doc.setFillColor(79, 70, 229);
        doc.rect(15, 15, 180, 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('NO', 18, 20);
        doc.text('NAMA LENGKAP SISWA', 27, 20);
        visibleGrades.forEach((g, i) => {
          doc.text(`${g.subject.substring(0, 12)}`, 90 + (i * 22), 20);
        });
        doc.text('RATA-RATA', 180, 20);
        currentY = 27;
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(15, currentY - 4, 180, 6, 'F');
      }

      doc.text(String(idx + 1), 18, currentY);
      doc.text(s.name, 27, currentY);

      let scoreSum = 0;
      let count = 0;
      
      visibleGrades.forEach((g, i) => {
        const val = g.scores[s.id];
        if (val !== undefined) {
          doc.text(String(val), 95 + (i * 22), currentY);
          scoreSum += val;
          count++;
        } else {
          doc.text('-', 95 + (i * 22), currentY);
        }
      });

      const avg = count > 0 ? Math.round(scoreSum / count) : 0;
      doc.setFont('Helvetica', 'bold');
      doc.text(String(avg), 182, currentY);
      doc.setFont('Helvetica', 'normal');

      currentY += 6;
    });

    doc.save(`Administrasi_Rekap_Nilai_${classInfo.className.replace(/\s+/g, '_')}.pdf`);
  };

  // Multi-download Bundle
  const handleDownloadAllZip = () => {
    exportSiswaExcel();
    setTimeout(() => exportPresensiExcel(), 200);
    setTimeout(() => exportKasExcel(), 400);
    setTimeout(() => exportJadwalExcel(), 600);
    setTimeout(() => exportAgendaExcel(), 800);
    setTimeout(() => exportPiketExcel(), 1000);
    setTimeout(() => exportNilaiExcel(), 1200);
  };

  return (
    <div className="space-y-6" id="admin-export-portal">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161B22] p-6 rounded-2xl border border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" /> Pusat Administrasi &amp; Unduhan Berkas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {currentUser.role === 'admin' 
              ? 'Akses administrator untuk memantau, memeriksa, dan mengekspor seluruh dokumen administrasi setiap kelas'
              : 'Ekspor dokumen laporan administrasi kelas Anda secara langsung dalam format dokumen digital resmi'}
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <div className="flex items-center gap-2.5 bg-indigo-950/40 border border-indigo-500/20 px-4 py-2.5 rounded-xl self-start md:self-center">
            <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider">Akses Kelas:</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="bg-slate-900 text-white font-bold text-xs rounded-lg border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 px-3 py-1.5"
            >
              {classTeachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.className} - {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Target Class Info Banner Card */}
      <div className="bg-[#10141A] rounded-2xl border border-slate-800/80 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[9px] font-bold tracking-widest text-indigo-400 uppercase">KELAS SASARAN EKSPOR</span>
          <h3 className="text-lg font-black text-white">{classInfo.className}</h3>
          <p className="text-xs text-slate-400">
            Wali Kelas: <strong className="text-slate-300 font-semibold">{teacher.name}</strong> • NPSN: <span className="font-mono">{classInfo.npsn || '20239485'}</span>
          </p>
        </div>

        {students.length > 0 && (
          <button
            onClick={handleDownloadAllZip}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            <Download className="w-4 h-4" /> Download Seluruh Paket (Excel)
          </button>
        )}
      </div>

      {/* No Data Fallback */}
      {students.length === 0 ? (
        <div className="text-center py-16 bg-[#161B22] border border-slate-800 rounded-2xl">
          <ClipboardList className="w-12 h-12 text-slate-650 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Tidak Ada Data Tersedia</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Wali kelas terpilih belum memasukkan atau melakukan input data ke dalam sistem e-portal kelas ini.
          </p>
        </div>
      ) : (
        /* GRID OF RESOURCE EXPORTS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Data Siswa */}
          <div className="bg-[#161B22] p-5.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">1. Daftar Siswa</h3>
                <p className="text-[11px] text-slate-450 leading-relaxed mt-1">
                  Seluruh profil biodata siswa, nomor NISN resmi, status murid, nama wali murid, dan detail kontak telp orang tua.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={exportSiswaPdf}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 text-[10px] font-bold uppercase transition"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> PDF
              </button>
              <button
                onClick={exportSiswaExcel}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/18 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
              </button>
            </div>
          </div>

          {/* Card 2: Rekap Presensi */}
          <div className="bg-[#161B22] p-5.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">2. Rekap Presensi</h3>
                <p className="text-[11px] text-slate-450 leading-relaxed mt-1">
                  Rekapitulasi total kehadiran harian, jumlah sakit (S), izin (I), alpa (A), serta persentase rata-rata kehadiran tiap siswa.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={exportPresensiPdf}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 text-[10px] font-bold uppercase transition"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> PDF
              </button>
              <button
                onClick={exportPresensiExcel}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/18 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
              </button>
            </div>
          </div>

          {/* Card 3: Buku Kas Keuangan */}
          <div className="bg-[#161B22] p-5.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">3. Buku Kas Kelas</h3>
                <p className="text-[11px] text-slate-450 leading-relaxed mt-1">
                  Laporan pembukuan keuangan kelas, arus kas pemasukan harian/mingguan, pengeluaran kas, serta saldo kas akhir.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={exportKasPdf}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 text-[10px] font-bold uppercase transition"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> PDF
              </button>
              <button
                onClick={exportKasExcel}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/18 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
              </button>
            </div>
          </div>

          {/* Card 4: Jadwal Pelajaran */}
          <div className="bg-[#161B22] p-5.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">4. Jadwal Pelajaran</h3>
                <p className="text-[11px] text-slate-450 leading-relaxed mt-1">
                  Daftar alokasi waktu mata pelajaran harian, pembagian hari KBM, subyek pelajaran, serta nama guru pembimbing pengampu.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={exportJadwalPdf}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 text-[10px] font-bold uppercase transition"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> PDF
              </button>
              <button
                onClick={exportJadwalExcel}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/18 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
              </button>
            </div>
          </div>

          {/* Card 5: Agenda & Tugas */}
          <div className="bg-[#161B22] p-5.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">5. Agenda &amp; Tugas</h3>
                <p className="text-[11px] text-slate-450 leading-relaxed mt-1">
                  Arsip catatan agenda pengajaran kelas, tugas mandiri, tenggat kegiatan ekstrakurikuler, dan rencana aksi belajar mingguan.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={exportAgendaPdf}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 text-[10px] font-bold uppercase transition"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> PDF
              </button>
              <button
                onClick={exportAgendaExcel}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/18 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
              </button>
            </div>
          </div>

          {/* Card 6: Jadwal Piket Kebersihan */}
          <div className="bg-[#161B22] p-5.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                <Calendar className="w-5 h-5 text-amber-450" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">6. Roster Piket Harian</h3>
                <p className="text-[11px] text-slate-450 leading-relaxed mt-1">
                  Jadwal piket kebersihan harian kelas, pembagian regu siswa dari hari Senin hingga Sabtu demi kerapian dan kebersihan kelas.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={exportPiketPdf}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 text-[10px] font-bold uppercase transition"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> PDF
              </button>
              <button
                onClick={exportPiketExcel}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/18 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
              </button>
            </div>
          </div>

          {/* Card 7: Rekap Nilas Akademis */}
          <div className="bg-[#161B22] p-5.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition shadow-sm md:col-span-2 lg:col-span-3">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                <Award className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">7. Rekapitulasi Nilai Siswa &amp; e-Rapor</h3>
                <p className="text-[11px] text-slate-450 leading-relaxed mt-1">
                  Laporan gabungan nilai tugas mandiri, penilaian formatif, sumatif tengah semester, sumatif akhir semester, dan kalkulasi rata-rata kumulatif rapor Kurikulum Merdeka.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2.5 pt-3 border-t border-slate-800/60">
              <button
                onClick={exportNilaiPdf}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-bold uppercase tracking-wide transition"
              >
                <FileText className="w-4 h-4 text-indigo-450" /> Unduh Laporan Nilai PDF
              </button>
              <button
                onClick={exportNilaiExcel}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/18 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wide transition"
              >
                <FileSpreadsheet className="w-4 h-4" /> Unduh Ledger Nilai Excel (.csv)
              </button>
            </div>
          </div>

          {/* Card 8: Google Apps Script Integration */}
          <div className="bg-[#161B22] p-5.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-5 hover:border-slate-700/80 transition shadow-sm md:col-span-2 lg:col-span-3" id="google-apps-script-card">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center text-violet-400 shrink-0">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">8. Integrasi Google Sheets via Apps Script (script.google.com)</h3>
                  <p className="text-[11px] text-slate-450 leading-relaxed mt-1">
                    Ekspor seluruh data administrasi kelas ini secara langsung ke Google Sheets secara otomatis menggunakan Google Apps Script (.gs) resmi.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 w-full lg:w-auto shrink-0">
                <button
                  onClick={handleCopyCode}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                    gasCopied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {gasCopied ? (
                    <>
                      <Check className="w-4 h-4" /> Kode Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Salin Kode Apps Script
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadCodeFile}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-bold transition"
                >
                  <Download className="w-4 h-4 text-violet-450" /> Unduh File .gs
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 border-t border-slate-800/60">
              {/* Petunjuk penggunaan */}
              <div className="lg:col-span-5 space-y-3.5 bg-slate-900/30 p-4 rounded-xl border border-slate-800/50 text-left">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-violet-400">Petunjuk Pemasangan Instan:</h4>
                <ol className="text-[11px] text-slate-300 space-y-2.5 list-decimal pl-4.5">
                  <li>Buka spreadsheet kosong baru di <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline font-semibold hover:text-indigo-300">Google Sheets</a>.</li>
                  <li>Di menu atas, pilih menu <strong className="text-white">Extensions</strong> (Ekstensi) &gt; <strong className="text-white">Apps Script</strong>.</li>
                  <li>Hapus semua kode bawaan (jika ada), lalu <strong className="text-white">Tempelkan (Paste)</strong> kode script yang telah disalin dari tombol di atas.</li>
                  <li>Tekan <strong className="text-white">Ctrl+S</strong> (atau klik tombol Save) untuk menyimpan script Anda.</li>
                  <li>Klik tombol <strong className="text-white">Run</strong> (Jalankan) dengan nama fungsi terpilih <strong className="text-indigo-400 font-mono font-bold">setupPortalSheets</strong>.</li>
                  <li>Setujui semua permintaan izin akses data Google Spreadsheet Anda.</li>
                  <li>Selesai! Google Sheets akan otomatis memuat 7 tab berisi seluruh data kelas Anda dengan visualisasi yang mewah secara instan!</li>
                </ol>
              </div>

              {/* Code preview area */}
              <div className="lg:col-span-7 flex flex-col space-y-1.5 text-left">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase px-1">
                  <span>Pratinjau Kode (.gs)</span>
                  <span className="font-mono text-indigo-400/80">Class Data: {classInfo.className}</span>
                </div>
                <div className="relative group bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-[10px] text-slate-350 leading-relaxed max-h-48 overflow-y-auto overflow-x-hidden">
                  <pre className="whitespace-pre-wrap select-all text-left">
                    {generateAppsScriptCode().substring(0, 1500)}
                    {"\n\n/* ... [Bagian data JSON murid, presensi, kas, jadwal, piket, dan nilai lengkap diunduh/disalin otomatis] ... */"}
                  </pre>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
