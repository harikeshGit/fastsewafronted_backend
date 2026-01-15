const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();

// Export bookings to Excel
router.get('/bookings/excel', requireAdmin, async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bookings');

        worksheet.columns = [
            { header: 'Client Name', key: 'clientName', width: 20 },
            { header: 'Service', key: 'service', width: 15 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Created At', key: 'createdAt', width: 20 },
        ];

        bookings.forEach(booking => {
            worksheet.addRow({
                clientName: booking.clientName,
                service: booking.service,
                phone: booking.phone,
                email: booking.email || '',
                description: booking.description || '',
                status: booking.status,
                createdAt: new Date(booking.createdAt).toLocaleString(),
            });
        });

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="bookings.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ error: 'Failed to export bookings' });
    }
});

// Export registrations to Excel
router.get('/registrations/excel', requireAdmin, async (req, res) => {
    try {
        const registrations = await Registration.find().sort({ createdAt: -1 });
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Registrations');

        worksheet.columns = [
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Address', key: 'address', width: 30 },
            { header: 'Service Interest', key: 'serviceInterest', width: 20 },
            { header: 'Registered At', key: 'registrationDate', width: 20 },
        ];

        registrations.forEach(reg => {
            worksheet.addRow({
                name: reg.name,
                email: reg.email,
                phone: reg.phone,
                address: reg.address || '',
                serviceInterest: reg.serviceInterest || '',
                registrationDate: new Date(reg.registrationDate).toLocaleString(),
            });
        });

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="registrations.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ error: 'Failed to export registrations' });
    }
});

// Export bookings to PDF
router.get('/bookings/pdf', requireAdmin, async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="bookings.pdf"');

        doc.pipe(res);
        doc.fontSize(20).font('Helvetica-Bold').text('Booking Service Data', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        bookings.forEach((booking, idx) => {
            doc.fontSize(11).font('Helvetica-Bold').text(`${idx + 1}. ${booking.clientName}`);
            doc.fontSize(9).font('Helvetica');
            doc.text(`Service: ${booking.service}`);
            doc.text(`Phone: ${booking.phone}`);
            doc.text(`Email: ${booking.email || 'N/A'}`);
            doc.text(`Description: ${booking.description || 'N/A'}`);
            doc.text(`Status: ${booking.status}`);
            doc.text(`Created: ${new Date(booking.createdAt).toLocaleString()}`);
            doc.moveDown(0.5);
        });

        doc.end();
    } catch (err) {
        res.status(500).json({ error: 'Failed to export to PDF' });
    }
});

// Export registrations to PDF
router.get('/registrations/pdf', requireAdmin, async (req, res) => {
    try {
        const registrations = await Registration.find().sort({ createdAt: -1 });
        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="registrations.pdf"');

        doc.pipe(res);
        doc.fontSize(20).font('Helvetica-Bold').text('Registration Data', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        registrations.forEach((reg, idx) => {
            doc.fontSize(11).font('Helvetica-Bold').text(`${idx + 1}. ${reg.name}`);
            doc.fontSize(9).font('Helvetica');
            doc.text(`Email: ${reg.email}`);
            doc.text(`Phone: ${reg.phone}`);
            doc.text(`Address: ${reg.address || 'N/A'}`);
            doc.text(`Service Interest: ${reg.serviceInterest || 'N/A'}`);
            doc.text(`Registered: ${new Date(reg.registrationDate).toLocaleString()}`);
            doc.moveDown(0.5);
        });

        doc.end();
    } catch (err) {
        res.status(500).json({ error: 'Failed to export to PDF' });
    }
});

// Export users to Excel
router.get('/users/excel', requireAdmin, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Users');

        worksheet.columns = [
            { header: 'First Name', key: 'firstName', width: 16 },
            { header: 'Last Name', key: 'lastName', width: 16 },
            { header: 'Email', key: 'email', width: 28 },
            { header: 'Role', key: 'role', width: 12 },
            { header: 'User Type', key: 'userType', width: 14 },
            { header: 'Active', key: 'isActive', width: 10 },
            { header: 'Created At', key: 'createdAt', width: 22 },
        ];

        users.forEach((u) => {
            worksheet.addRow({
                firstName: u.firstName || '',
                lastName: u.lastName || '',
                email: u.email || '',
                role: u.role || 'user',
                userType: u.userType || '',
                isActive: u.isActive ? 'Yes' : 'No',
                createdAt: new Date(u.createdAt).toLocaleString(),
            });
        });

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9C27B0' } };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="users.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ error: 'Failed to export users' });
    }
});

// Export users to PDF
router.get('/users/pdf', requireAdmin, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="users.pdf"');

        doc.pipe(res);
        doc.fontSize(20).font('Helvetica-Bold').text('Users Data', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        if (users.length === 0) {
            doc.fontSize(12).font('Helvetica').text('No users found.');
            doc.end();
            return;
        }

        users.forEach((u, idx) => {
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User';
            doc.fontSize(11).font('Helvetica-Bold').text(`${idx + 1}. ${name}`);
            doc.fontSize(9).font('Helvetica');
            doc.text(`Email: ${u.email || 'N/A'}`);
            doc.text(`Role: ${u.role || 'user'}`);
            doc.text(`User Type: ${u.userType || 'N/A'}`);
            doc.text(`Active: ${u.isActive ? 'Yes' : 'No'}`);
            doc.text(`Created: ${new Date(u.createdAt).toLocaleString()}`);
            doc.moveDown(0.5);
        });

        doc.end();
    } catch (err) {
        res.status(500).json({ error: 'Failed to export users' });
    }
});

module.exports = router;
