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
        id, 
        treatmentID, 
        timestamp, 
        next_treatment_date, 
        dispensing_medicine, 
        latest_treatment_detail
    FROM 
        treatment_detail
    WHERE 
        treatmentID = ?;
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
//get edit treatment
//get edit patient
//get edit doctor

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

    db.run(`DELETE FROM treatment WHERE id = ?`, treatmentID, function (err) {
        if (err) {
            console.error('Error deleting treatment:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Treatment deleted successfully' });
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

// // Get a movies, studio_name
// app.get('/movies_reviews', (req, res) => {
//     db.all('SELECT movies.movie_name, studio.name FROM studio JOIN movies ON studio.id = movies.studioID', (err, rows) => {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.json(rows);
//         }
//     });
// });

// // CRUD For Movies
// app.get('/movies', (req, res) => {
//     db.all(`SELECT movies.id,
//             movies.movie_name,
//             category.name AS category_name,
//             studio.name AS studio_name,
//             movies.movie_detail, 
//             movies.director,
//             movies.flimmaking_funds, 
//             movies.movie_income
//             FROM movies 
//             JOIN category ON movies.categoryID = category.id
//             JOIN studio ON movies.studioID = studio.id`, (err, row) => {
//         // db.all(`SELECT * FROM movies`, (err, row) => {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.json(row);
//         }
//     });
// });

// // route to get a movies by id
// app.get('/movies/:id', (req, res) => {
//     db.get('SELECT * FROM movies WHERE id = ?', req.params.id, (err, row) => {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             if (!row) {
//                 res.status(404).send('Movies not found');
//             } else {
//                 res.json(row);
//             }
//         }
//     });
// });

// // route to creata a new movies
// app.post('/movies', (req, res) => {
//     const movie = req.body;

//     // Query ชื่อ category จากตาราง category
//     db.get(`SELECT name FROM category WHERE id = ?`, [movie.categoryID], (err, category) => {
//         if (err) {
//             return res.status(500).send('Error fetching category');
//         }

//         // Query ชื่อ studio จากตาราง studio
//         db.get(`SELECT name FROM studio WHERE id = ?`, [movie.studioID], (err, studio) => {
//             if (err) {
//                 return res.status(500).send('Error fetching studio');
//             }

//             // เมื่อได้ชื่อ category และ studio แล้วทำการ insert ข้อมูลลงในตาราง movies
//             db.run(`INSERT INTO movies (movie_name, categoryID, studioID, movie_detail, director, flimmaking_funds, movie_income) 
//                     VALUES (?, ?, ?, ?, ?, ?, ?)`, 
//                 movie.movie_name, 
//                 category.name,  // ใส่ชื่อ category แทน categoryID
//                 studio.name,    // ใส่ชื่อ studio แทน studioID
//                 movie.movie_detail, 
//                 movie.director, 
//                 movie.flimmaking_funds, 
//                 movie.movie_income, 
//                 function(err) {
//                     if (err) {
//                         res.status(500).send('Error inserting movie');
//                     } else {
//                         res.send(movie);
//                     }
//                 });
//         });
//     });
// });


// // route to update a movies
// app.put('/movies/:id', (req, res) => {
//     const movie = req.body;
//     db.run('UPDATE movies SET movie_name = ?, categoryID = ?, studioID = ?, movie_detail = ?, director = ?, flimmaking_funds = ?, movie_income = ? WHERE id = ?', 
//         movie.movie_name, movie.categoryID, movie.studioID, movie.movie_detail, movie.director, movie.flimmaking_funds, movie.movie_income, req.params.id, function(err) {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.send(movie);
//         }
//     });  
// });

// // route to delete a movies
// app.delete('/movies/:id', (req, res) => {
//     db.run('DELETE FROM movies WHERE id = ?', req.params.id, function(err) {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.send({});
//         }
//     });
// });

// // Get a movie_detail & reviews
// app.get('/movie_detail&review/:id', (req, res) => {
//     db.get(`SELECT 
//             movies.movie_name,
//             category.name AS category_name,
//             studio.name AS studio_name,
//             movies.movie_detail, 
//             movies.director,
//             movies.flimmaking_funds, 
//             movies.movie_income, 
//             review.reviewer, 
//             review.review_detail, 
//             review.overall_score
//             FROM movies 
//             JOIN review ON movies.id = review.movieID
//             JOIN category ON movies.categoryID = category.id
//             JOIN studio ON movies.studioID = studio.id
//             WHERE movies.id = ?`, req.params.id, (err, row) => {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             if (!row) {
//                 res.status(404).send('Movies not found');
//             } else {
//                 res.json(row);
//             }
//         }
//     });
// });

// // CRUD For Review
// app.get('/review', (req, res) => {
//     db.all('SELECT * FROM review', (err, rows) => {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.json(rows);
//         }
//     });
// });

// // route to get a review by id
// app.get('/review/:id', (req, res) => {
//     db.get('SELECT * FROM review WHERE id = ?', req.params.id, (err, row) => {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             if (!row) {
//                 res.status(404).send('review not found');
//             } else {
//                 res.json(row);
//             }
//         }
//     });
// });

// // route to create a new review
// app.post('/review', (req, res) => {
//     const review = req.body;
//     db.run('INSERT INTO review (movieID, review_detail, overall_score, reviewer) VALUES (?, ?, ?, ?)', 
//             review.movieID, review.review_detail, review.overall_score, review.reviewer, req.params.id, function(err) {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.send(review);
//         }
//     });
// });

// // route to update a review
// app.put('/review/:id', (req, res) => {
//     const review = req.body;
//     db.run('UPDATE review SET movieID = ?, review_detail = ?, overall_score = ?, reviewer = ? WHERE id = ?', 
//         review.movieID, review.review_detail, review.overall_score, review.reviewer, req.params.id, function(err) {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.send(review);
//         }
//     });  
// });

// // route to delete a review
// app.delete('/review/:id', (req, res) => {
//     db.run('DELETE FROM review WHERE id = ?', req.params.id, function(err) {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.send({});
//         }
//     });
// });

// // CRUD For Category
// app.get('/category', (req, res) => {
//     db.all('SELECT * FROM category', (err, rows) => {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.json(rows);
//         }
//     });
// });

// // route to get a category by id
// app.get('/category/:id', (req, res) => {
//     db.get('SELECT * FROM category WHERE id = ?', req.params.id, (err, row) => {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             if (!row) {
//                 res.status(404).send('category not found');
//             } else {
//                 res.json(row);
//             }
//         }
//     });
// });

// // route to creata a new category
// app.post('/category', (req, res) => {
//     const category = req.body;
//     db.run('INSERT INTO category (name, detail) VALUES (?, ?)', 
//             category.name, category.detail, req.params.id, function(err) {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.send(category);
//         }
//     });
// });

// // route to update a category
// app.put('/category/:id', (req, res) => {
//     const category = req.body;
//     db.run('UPDATE category SET name = ?, detail = ? WHERE id = ?', 
//             category.name, category.detail, req.params.id, function(err) {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.send(category);
//         }
//     });  
// });

// // route to delete a category
// app.delete('/category/:id', (req, res) => {
//     db.run('DELETE FROM category WHERE id = ?', req.params.id, function(err) {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.send({});
//         }
//     });
// });

// // CRUD For Studio
// app.get('/studio', (req, res) => {
//     db.all('SELECT * FROM studio', (err, rows) => {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.json(rows);
//         }
//     });
// });

// // route to get a studio by id
// app.get('/studio/:id', (req, res) => {
//     db.get('SELECT * FROM studio WHERE id = ?', req.params.id, (err, row) => {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             if (!row) {
//                 res.status(404).send('studio not found');
//             } else {
//                 res.json(row);
//             }
//         }
//     });
// });

// // route to creata a new studio
// app.post('/studio', (req, res) => {
//     const studio = req.body;
//     db.run('INSERT INTO studio (name, detail) VALUES (?, ?)', 
//             studio.name, studio.detail, req.params.id, function(err) {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.send(studio);
//         }
//     });
// });

// // route to update a studio
// app.put('/studio/:id', (req, res) => {
//     const studio = req.body;
//     db.run('UPDATE studio SET name = ?, detail = ? WHERE id = ?', 
//         studio.name, studio.detail, req.params.id, function(err) {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.send(studio);
//         }
//     });  
// });

// // route to delete a studio
// app.delete('/studio/:id', (req, res) => {
//     db.run('DELETE FROM studio WHERE id = ?', req.params.id, function(err) {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.send({});
//         }
//     });
// });

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`),)
