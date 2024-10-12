const express = require('express');
const sqlite3 = require('sqlite3');
const app = express();

// Connect to the SQLite database
const db = new sqlite3.Database('./Database/clinic.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        
        // Enable foreign key enforcement
        db.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) {
                console.error('Error enabling foreign keys:', err.message);
            }
        });

        // Create doctor table
        db.run(`CREATE TABLE IF NOT EXISTS doctor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255),
            department VARCHAR(255),
            contact VARCHAR(255),
            date_of_birth DATE,
            doctor_detail TEXT,
            medical_practice_license_number VARCHAR(255)
        )`, (err) => {
            if (err) {
                console.error('Error creating doctor table:', err.message);
            } else {
                console.log('Doctor table created or already exists.');
            }
        });

        // Create patient table
        db.run(`CREATE TABLE IF NOT EXISTS patient (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255),
            date_of_birth DATE,
            blood_type VARCHAR(5),
            weight INTEGER,
            height INTEGER,
            contact VARCHAR(255),
            patient_detail TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating patient table:', err.message);
            } else {
                console.log('Patient table created or already exists.');
            }
        });

        // Create treatment table
        db.run(`CREATE TABLE IF NOT EXISTS treatment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doctorID INTEGER,
            patientID INTEGER,
            status VARCHAR(255),
            start_treatment_date DATETIME,
            last_treated_date DATETIME,
            short_detail TEXT,
            FOREIGN KEY (doctorID) REFERENCES doctor(id) ON DELETE CASCADE,
            FOREIGN KEY (patientID) REFERENCES patient(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) {
                console.error('Error creating treatment table:', err.message);
            } else {
                console.log('Treatment table created or already exists.');
            }
        });

        // Create treatment_detail table
        db.run(`CREATE TABLE IF NOT EXISTS treatment_detail (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            treatmentID INTEGER,
            timestamp DATETIME,
            next_treatment_date DATE,
            dispensing_medicine TEXT,
            latest_treatment_detail TEXT,
            FOREIGN KEY (treatmentID) REFERENCES treatment(id)
        )`, (err) => {
            if (err) {
                console.error('Error creating treatment_detail table:', err.message);
            } else {
                console.log('Treatment detail table created or already exists.');
            }
        });
    }
});

// Parse incoming JSON requests
app.use(express.json());

//get INET_Clinic
app.get('/treatment', (req, res) => {
    const query = `
    SELECT 
        treatment.id, 
        treatment.status, 
        treatment.start_treatment_date, 
        treatment.last_treated_date, 
        treatment.short_detail, 
        doctor.name AS doctor_name, 
        patient.name AS patient_name
    FROM 
        treatment
    JOIN 
        doctor ON treatment.doctorID = doctor.id
    JOIN 
        patient ON treatment.patientID = patient.id;
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error executing query:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

//get treatment detail
app.get('/treatment-details/:treatmentID', (req, res) => {
    const treatmentID = req.params.treatmentID;

    const query = `
    SELECT 
        td.id AS treatment_detail_id,
        td.treatmentID,
        td.timestamp,
        td.next_treatment_date,
        td.dispensing_medicine,
        td.latest_treatment_detail,
        t.status,
        t.start_treatment_date,
        t.last_treated_date,
        t.short_detail,
        p.name AS patient_name,
        d.name AS doctor_name
    FROM 
        treatment_detail td
    JOIN 
        treatment t ON td.treatmentID = t.id
    JOIN 
        patient p ON t.patientID = p.id
    JOIN 
        doctor d ON t.doctorID = d.id
    WHERE 
        td.treatmentID = ?;
    `;

    // Execute the query with the provided treatmentID
    db.all(query, [treatmentID], (err, rows) => {
        if (err) {
            console.error('Error executing query:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        if (rows.length === 0) {
            res.status(404).json({ message: 'No treatment details found for the given treatmentID' });
        } else {
            res.json(rows);
        }
    });
});

//get edit treatment detail
app.get('/treatment-detail-edit/:id', (req, res) => {
    const treatmentDetailID = req.params.id;

    const query = `SELECT * FROM treatment_detail WHERE id = ?`;

    db.get(query, [treatmentDetailID], (err, row) => {
        if (err) {
            console.error('Error retrieving treatment detail:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }

        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ message: 'Treatment detail not found' });
        }
    });
});
//get edit treatment
app.get('/treatment-edit/:id', (req, res) => {
    const treatmentID = req.params.id;

    const query = `SELECT * FROM treatment WHERE id = ?`;

    db.get(query, [treatmentID], (err, row) => {
        if (err) {
            console.error('Error retrieving treatment:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }

        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ message: 'Treatment not found' });
        }
    });
});
//get edit patient
app.get('/patient-edit/:id', (req, res) => {
    const patientID = req.params.id;

    const query = `SELECT * FROM patient WHERE id = ?`;

    db.get(query, [patientID], (err, row) => {
        if (err) {
            console.error('Error retrieving patient:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }

        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    });
});

//get edit doctor
app.get('/doctor-edit/:id', (req, res) => {
    const doctorID = req.params.id;

    const query = `SELECT * FROM doctor WHERE id = ?`;

    db.get(query, [doctorID], (err, row) => {
        if (err) {
            console.error('Error retrieving doctor:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }

        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ message: 'Doctor not found' });
        }
    });
});





//add treatment
app.post('/treatment', (req, res) => {
    const { doctorID, patientID, status, start_treatment_date, last_treated_date, short_detail } = req.body;

    const query = `
    INSERT INTO treatment (doctorID, patientID, status, start_treatment_date, last_treated_date, short_detail)
    VALUES (?, ?, ?, ?, ?, ?);
    `;

    // Execute the insert query
    db.run(query, [doctorID, patientID, status, start_treatment_date, last_treated_date, short_detail], function (err) {
        if (err) {
            console.error('Error inserting data into treatment table:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        // Respond with the id of the newly inserted row
        res.json({ message: 'Treatment added successfully', treatmentID: this.lastID });
    });
});
// add treatment_detail
app.post('/treatment-detail', (req, res) => {
    const { treatmentID, timestamp, next_treatment_date, dispensing_medicine, latest_treatment_detail } = req.body;

    const query = `
    INSERT INTO treatment_detail (treatmentID, timestamp, next_treatment_date, dispensing_medicine, latest_treatment_detail)
    VALUES (?, ?, ?, ?, ?);
    `;

    // Execute the insert query
    db.run(query, [treatmentID, timestamp, next_treatment_date, dispensing_medicine, latest_treatment_detail], function (err) {
        if (err) {
            console.error('Error inserting data into treatment_detail table:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        // Respond with the id of the newly inserted row
        res.json({ message: 'Treatment detail added successfully', treatmentDetailID: this.lastID });
    });
});

//add patient
app.post('/patient', (req, res) => {
    const { name, date_of_birth, blood_type, weight, height, contact, patient_detail } = req.body;

    const query = `
    INSERT INTO patient (name, date_of_birth, blood_type, weight, height, contact, patient_detail)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    // Execute the insert query
    db.run(query, [name, date_of_birth, blood_type, weight, height, contact, patient_detail], function (err) {
        if (err) {
            console.error('Error inserting data into patient table:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        // Respond with the id of the newly inserted row
        res.json({ message: 'Patient added successfully', patientID: this.lastID });
    });
});

//add doctor

app.post('/doctor', (req, res) => {
    const { name, department, contact, date_of_birth, doctor_detail, medical_practice_license_number } = req.body;

    const query = `
    INSERT INTO doctor (name, department, contact, date_of_birth, doctor_detail, medical_practice_license_number)
    VALUES (?, ?, ?, ?, ?, ?);
    `;

    // Execute the insert query
    db.run(query, [name, department, contact, date_of_birth, doctor_detail, medical_practice_license_number], function (err) {
        if (err) {
            console.error('Error inserting data into doctor table:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        // Respond with the id of the newly inserted row
        res.json({ message: 'Doctor added successfully', doctorID: this.lastID });
    });
});



//edit

app.put('/treatment/:id', (req, res) => {
    const treatmentID = req.params.id;
    const { doctorID, patientID, status, start_treatment_date, last_treated_date, short_detail } = req.body;

    const query = `UPDATE treatment SET doctorID = ?, patientID = ?, status = ?, start_treatment_date = ?, last_treated_date = ?, short_detail = ? WHERE id = ?`;

    db.run(query, [doctorID, patientID, status, start_treatment_date, last_treated_date, short_detail, treatmentID], function(err) {
        if (err) {
            console.error('Error updating treatment:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Treatment updated successfully', changes: this.changes });
    });
});

// Edit Treatment Detail
app.put('/treatment_detail/:id', (req, res) => {
    const treatmentDetailID = req.params.id;
    const { treatmentID, timestamp, next_treatment_date, dispensing_medicine, latest_treatment_detail } = req.body;

    const query = `UPDATE treatment_detail SET treatmentID = ?, timestamp = ?, next_treatment_date = ?, dispensing_medicine = ?, latest_treatment_detail = ? WHERE id = ?`;

    db.run(query, [treatmentID, timestamp, next_treatment_date, dispensing_medicine, latest_treatment_detail, treatmentDetailID], function(err) {
        if (err) {
            console.error('Error updating treatment detail:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Treatment detail updated successfully', changes: this.changes });
    });
});

// Edit Doctor
app.put('/doctor/:id', (req, res) => {
    const doctorID = req.params.id;
    const { name, department, contact, date_of_birth, doctor_detail, medical_practice_license_number } = req.body;

    const query = `UPDATE doctor SET name = ?, department = ?, contact = ?, date_of_birth = ?, doctor_detail = ?, medical_practice_license_number = ? WHERE id = ?`;

    db.run(query, [name, department, contact, date_of_birth, doctor_detail, medical_practice_license_number, doctorID], function(err) {
        if (err) {
            console.error('Error updating doctor:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Doctor updated successfully', changes: this.changes });
    });
});

// Edit Patient
app.put('/patient/:id', (req, res) => {
    const patientID = req.params.id;
    const { name, date_of_birth, blood_type, weight, height, contact, patient_detail } = req.body;

    const query = `UPDATE patient SET name = ?, date_of_birth = ?, blood_type = ?, weight = ?, height = ?, contact = ?, patient_detail = ? WHERE id = ?`;

    db.run(query, [name, date_of_birth, blood_type, weight, height, contact, patient_detail, patientID], function(err) {
        if (err) {
            console.error('Error updating patient:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Patient updated successfully', changes: this.changes });
    });
});














// Route to delete a doctor by id
app.delete('/doctor/:id', (req, res) => {
    const doctorID = req.params.id;

    db.run(`DELETE FROM doctor WHERE id = ?`, doctorID, function (err) {
        if (err) {
            console.error('Error deleting doctor:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Doctor deleted successfully' });
    });
});

// Route to delete a patient by id
app.delete('/patient/:id', (req, res) => {
    const patientID = req.params.id;

    db.run(`DELETE FROM patient WHERE id = ?`, patientID, function (err) {
        if (err) {
            console.error('Error deleting patient:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Patient deleted successfully' });
    });
});

// Route to delete a treatment by id
app.delete('/treatment/:id', (req, res) => {
    const treatmentID = req.params.id;

    // Delete all corresponding treatment_detail records first
    db.run(`DELETE FROM treatment_detail WHERE treatmentID = ?`, treatmentID, function (err) {
        if (err) {
            console.error('Error deleting treatment details:', err.message);
            res.status(500).json({ error: 'Error deleting related treatment details' });
            return;
        }

        // Once treatment_detail records are deleted, delete the treatment record itself
        db.run(`DELETE FROM treatment WHERE id = ?`, treatmentID, function (err) {
            if (err) {
                console.error('Error deleting treatment:', err.message);
                res.status(500).json({ error: 'Error deleting treatment' });
                return;
            }

            res.json({ message: 'Treatment and related treatment details deleted successfully' });
        });
    });
});


// Route to delete a treatment_detail by id
app.delete('/treatment-detail/:id', (req, res) => {
    const treatmentDetailID = req.params.id;

    db.run(`DELETE FROM treatment_detail WHERE id = ?`, treatmentDetailID, function (err) {
        if (err) {
            console.error('Error deleting treatment detail:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Treatment detail deleted successfully' });
    });
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`),)
