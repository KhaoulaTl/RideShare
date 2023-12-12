const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require("bcryptjs")
const express = require("express");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const ini = require('ini');
const http = require('http');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // You may want to customize the destination folder.
const { ObjectID } = require('mongodb');



const app = express();

const config = ini.parse(fs.readFileSync('db.ini', 'utf-8'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', config.ACCESS_CONTROL_ALLOW_ORIGIN); // Set the specific origin of your Angular app here
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('SameSite', 'None');
    res.setHeader('Secure', 'true');
    next();
});


const port = process.env.PORT || 3000;
const username = config.username;
const password = config.password;
const uri = "mongodb+srv://" + username + ":" + password + "@cluster0.vluyofh.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

module.exports.uploadImage = () => {
    const imageStorage = multer.diskStorage({
        destination: (req, file, cb) => { cb(null, 'public/images') },
        filename: (req, file, cb) => { cb(null, file.originalname) }
    });

    const imageFileFilter = (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('You can upload only image files!'), false);
        }
        cb(null, true);
    };

    return multer({ storage: imageStorage, fileFilter: imageFileFilter });
}

app.get('/', (req, res) => {
    res.send('Covoitu API is running!');
});
app.post('/signup', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('Covoitu');
        const { email, password, name, firstname, birthdate, pref_smoking, pref_animals, pref_talk, phone, role } = req.body;

        // Check if user already exists with the given email
        const existingUser = await db.collection('user').findOne({ email });
        if (existingUser) {
            return res.status(400).send('User with this email already exists');
        }

        if (!email || !password || !name || !firstname || !birthdate || !phone ) {
            return res.status(400).send('Missing parameters');
        }

        // Hash the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user document with the hashed password and role
        const newUser = {
            email: email.toLowerCase(),
            password: hashedPassword,
            name: name,
            firstname: firstname,
            birthdate: birthdate,
            pref_smoking: pref_smoking || false,
            pref_animals: pref_animals || false,
            pref_talk: pref_talk || false,
            phone: phone,
            //role: role === 'admin' ? 'admin' : 'user', // Assign the role to the user
           
        };

        // Insert the new user document into the "user" collection
        const user = await db.collection('user').insertOne(newUser);

        // Find the user in the database to get its ID
        const insertedUser = await db.collection('user').findOne({ _id: user.insertedId });
        const payload = {
            email: insertedUser.email,
            id: insertedUser._id, // Add the user's ID as a claim in the JWT
           // role: insertedUser.role // Add the user's role as a claim in the JWT
        };

        // If passwords match, create a JWT token with the user's data
        const token = jwt.sign(payload, config.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });

        // Set the JWT token as a cookie in the response
        res.cookie('auth', token, {
            httpOnly: false,
            secure: false,
            sameSite: 'strict',
        });

        // Redirect the user to the /profile route
        res.status(201).send({ id: user._id });
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).send('Error connecting to database');
    }
});



app.post('/login', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('Covoitu');
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send('Missing parameters');
        }

        lowEmail = email.toLowerCase();
        const user = await db.collection('user').findOne({ email: lowEmail });

        if (!user) {
            return res.status(401).send('Invalid user');
        }

        // Compare the submitted password with the hashed password stored in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).send('Invalid password');
        }

        const payload = {
            email: user.email,
            id: user._id // Add the user's ID as a claim in the JWT
        };

        // If passwords match, create a JWT token with the user's data
        const token = jwt.sign(payload, config.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });

        // Set the JWT token as a cookie in the response
        res.cookie('auth', token, {
            httpOnly: false,
            secure: false,
            sameSite: 'strict',
        });

        let message;
        //if (user.role === 'admin') {
         //   message = 'Admin logged in successfully';
        //} else {
        //    message = 'User logged in successfully';
        //}
        
        // Send the role-specific success message along with the user's ID and token
        res.status(201).send({ id: user._id, message, token });
        
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).send('Error connecting to the database');
    }
});


app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const db = client.db('Covoitu');
        const user = await db.collection('user').findOne({ _id: new ObjectId(userId) });
        if (user) {
            res.json(user);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).send('Error connecting to database');
    }
});



app.post('/profile/edit', authenticateToken, async (req, res) => {
    try {
        const { name, firstname, email, phone, birthdate, pref_animals, pref_talk, pref_smoking, brand, model, color, registration, card_num, card_cvc, card_exp } = req.body;
        const db = client.db('Covoitu');
        const user = await db.collection('user').findOne({ _id: new ObjectId(req.user._id) });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update email if provided and not already taken by another user
        if (email) {
            const emailTaken = await db.collection('users').findOne({ email: email });
            if (emailTaken) {
                return res.status(400).send('Email already taken');
            }
            user.email = email;
        }

        // Update password if provided
        // if (password) {
        //     user.password = await bcrypt.hash(password, 10);
        // }
        if (name) {
            user.name = name;
        }

        if (firstname) {
            user.firstname = firstname;
        }

        if (phone) {
            user.phone = phone;
        }

        if (birthdate) {
            user.birthdate = birthdate;
        }

        // Update preferences if provided
        if (pref_animals !== undefined) {
            user.pref_animals = pref_animals;
        }
        if (pref_talk !== undefined) {
            user.pref_talk = pref_talk;
        }
        if (pref_smoking !== undefined) {
            user.pref_smoking = pref_smoking;
        }

        const vehicle = {};
        if (brand) {
            vehicle.brand = brand;
        }
        if (model) {
            vehicle.model = model;
        }
        if (color) {
            vehicle.color = color;
        }
        if (registration) {
            vehicle.registration = registration;
        }
        user.vehicle = vehicle;

        const payment = {};
        if (card_num) {
            payment.card_num = card_num;
        }
        if (card_cvc) {
            payment.card_cvc = card_cvc;
        }
        if (card_exp) {
            const [year, month, day] = card_exp.split('-')
            payment.card_exp = new Date(year, month - 1, day);
        }
        user.payment_method = payment;



        // Save the updated user object to the database
        const result = await db.collection('user').findOneAndUpdate(
            { _id: new ObjectId(req.user._id) },
            { $set: user },
            { returnOriginal: false }
        );

        res.status(200).json("User updated");
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).send('Error connecting to database');
    }
});


app.post('/profile/password', authenticateToken, async (req, res) => {
    try {
        const { password, new_password } = req.body;
        const db = client.db('Covoitu');
        const user = await db.collection('user').findOne({ _id: new ObjectId(req.user._id) });

        if (!user) {
            return res.status(404).send('User not found');
        }
        if (!password || !new_password) {
            return res.status(400).send('Missing parameters');
        }

        if (!await bcrypt.compare(password, user.password)) {
            return res.status(401).send('Invalid password');
        }

        if (password === new_password) {
            return res.status(400).send('New password must be different from old password');
        }
        user.password = await bcrypt.hash(new_password, 10);

        const result = await db.collection('user').findOneAndUpdate(
            { _id: new ObjectId(req.user._id) },
            { $set: user },
            { returnOriginal: false }
        );

        res.status(200).json("User updated");

    }
    catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).send('Error connecting to database');
    }
});

app.post('/publish', authenticateToken, async (req, res) => {
    try {
        const { departure, arrival, date, seats, highway, price, description } = req.body;

        // Validation des paramètres
        if (!departure || !arrival || !date || !seats || !price || !description) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        // Validation supplémentaire si nécessaire...

        const db = client.db('Covoitu');

        // Création du trajet
        const trip = {
            driver: new ObjectId(req.user._id),
            departure,
            arrival,
            departure_coords: await forwardGeocode(departure),
            arrival_coords: await forwardGeocode(arrival),
            date: new Date(date),
            seats: parseInt(seats),
            highway: highway || false,
            price: parseFloat(price),
            passengers: [],
            description,
        };

        // Insertion du trajet dans la collection 'trip'
        const result = await db.collection('trip').insertOne(trip);

        // Réponse avec l'ID du trajet créé
        res.status(201).json({ id: result.insertedId });
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).json({ error: 'Error connecting to database' });
    }
});


app.get('/trips', authenticateToken, async (req, res) => {
    try {
        const db = client.db('Covoitu');
        const trips = await db.collection('trip').find({
            $or: [
                { driver: new ObjectId(req.user._id) },
                { "passengers.passenger_id": new ObjectId(req.user._id) }
            ]
        }).toArray();

        // Get driver names from user collection
        const driverIds = [...new Set(trips.map(trip => trip.driver))];
        const drivers = await db.collection('user').find({ _id: { $in: driverIds } }).toArray();
        const driverMap = new Map(drivers.map(driver => [driver._id.toString(), driver.firstname]));


        // Add driver name to each trip
        trips.forEach(trip => {
            trip.driver = driverMap.get(trip.driver.toString());
        });

        res.json(trips);
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).send('Error connecting to database');
    }
});
/*app.put('/trip/:id', authenticateToken, async (req, res) => {
    try {
        const tripId = req.params.id;
        const { departure, arrival, date, seats, highway, price, description } = req.body;

        // Validation des paramètres
        if (!departure || !arrival || !date || !seats || !price || !description) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        const db = client.db('Covoitu');

        // Vérifier si l'utilisateur est le conducteur du trajet
        const existingTrip = await db.collection('trip').findOne({
            _id: new ObjectId(tripId),
            driver: new ObjectId(req.user._id)
        });

        if (!existingTrip) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Mise à jour du trajet
        const updatedTrip = {
            departure,
            arrival,
            departure_coords: await forwardGeocode(departure),
            arrival_coords: await forwardGeocode(arrival),
            date: new Date(date),
            seats: parseInt(seats),
            highway: highway || false,
            price: parseFloat(price),
            description,
        };

        // Effectuer la mise à jour dans la collection 'trip'
        await db.collection('trip').updateOne({ _id: new ObjectId(tripId) }, { $set: updatedTrip });

        res.status(200).json({ message: 'Trip updated successfully' });
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).json({ error: 'Error connecting to database' });
    }
});
*/

app.delete('/trip/:id', authenticateToken, async (req, res) => {
    try {
        const db = client.db('Covoitu');
        const collection = db.collection('trip');
        const tripId = req.params.id;

        // Find the trip in the database
        const trip = await collection.findOne({ _id: new ObjectId(tripId) });

        // Check if the authenticated user is the driver of the trip
        if (req.user._id.toString() !== trip.driver.toString()) {
            return res.status(401).send('Unauthorized');
        }

        // Delete the trip from the database
        const result = await collection.deleteOne({ _id: new ObjectId(tripId) });
        if (result.deletedCount === 0) {
            return res.status(404).send('Trip not found');
        }

        res.status(204).send();
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).send('Error connecting to the database');
    }
});


app.get('/search', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('Covoitu');

        const documents = await db.collection("trip").aggregate([
            {
                $lookup: {
                    from: "user", // Le nom de la collection à joindre (user)
                    localField: "driver", // Le champ local à utiliser pour la jointure (ID du conducteur dans trip)
                    foreignField: "_id", // Le champ étranger dans la collection à joindre (ID de l'utilisateur dans user)
                    as: "driverDetails" // Le nom du nouveau champ qui contiendra les détails du conducteur
                }
            },
            {
                $unwind: "$driverDetails" // Permet de déplier le tableau créé par la jointure
            },
            {
                $project: {
                    _id: 1,
                    driverDetails: { firstname: 1 }, // Inclure le nom et le prénom du conducteur dans les résultats
                    departure: 1,
                    arrival: 1,
                    departure_coords: 1,
                    arrival_coords: 1,
                    date: 1,
                    seats: 1,
                    highway: 1,
                    price: 1,
                    //passengers: 1,
                    description: 1
                }
            }
        ]).toArray();

        res.json(documents);
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).send('Error connecting to database');
    }
});


app.get('/search/:departure/:arrival', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('Covoitu');
        const { departure, arrival } = req.params;
        const { date, seat } = req.query;

        // Utilisation d'expressions régulières pour rendre la recherche insensible à la casse
        const departureRegex = new RegExp(departure, 'i');
        const arrivalRegex = new RegExp(arrival, 'i');

        const filter = {
            departure: departureRegex,
            arrival: arrivalRegex,
        };

        // Ajout de la condition pour inclure la date uniquement si elle est fournie
        if (date) {
            const dateObj = new Date(date);
            dateObj.setHours(0, 0, 0, 0);
            filter.date = {
                $gte: dateObj,
                $lte: new Date(dateObj.getTime() + (24 * 60 * 60 * 1000) - 1)
            };
        }

        // Ajout de la condition pour inclure le filtre de sièges uniquement s'il est fourni
        if (seat) {
            filter.seats = { $gte: parseInt(seat) };
        } else {
            filter.seats = { $gte: 1 };
        }

        // Utiliser la méthode aggregate pour faire une jointure avec la collection des utilisateurs
        const documents = await db.collection("trip").aggregate([
            {
                $match: filter
            },
            {
                $lookup: {
                    from: "user", // Le nom de la collection à joindre (user)
                    localField: "driver", // Le champ local à utiliser pour la jointure (ID du conducteur dans trip)
                    foreignField: "_id", // Le champ étranger dans la collection à joindre (ID de l'utilisateur dans user)
                    as: "driverDetails" // Le nom du nouveau champ qui contiendra les détails du conducteur
                }
            },
            {
                $unwind: "$driverDetails" // Permet de déplier le tableau créé par la jointure
            },
            {
                $project: {
                    _id: 1,
                    driverDetails: { firstname: 1 }, // Inclure uniquement le prénom du conducteur dans les résultats
                    departure: 1,
                    arrival: 1,
                    date: 1,
                    seats: 1,
                    highway: 1,
                    price: 1,
                    description: 1
                }
            }
        ]).toArray();

        res.json(documents);
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).send('Error connecting to database');
    }
});


app.get('/trip/:id', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('Covoitu');
        const { id } = req.params;
        const filter = {
            _id: new ObjectId(id),
        };
        const documents = await db.collection("trip").find(filter).toArray();
        res.json(documents);
    } catch (err) {
        res.status(500).send('No trip found');
    }


});

app.get('/pending/:id', authenticateToken, async (req, res) => {
    try {
        await client.connect();
        const db = client.db('Covoitu');
        const { id } = req.params;
        const filter = {
            trip_id: new ObjectId(id),
        };
        const documents = await db.collection("pending").find(filter).toArray();
        if (documents.length == 0)
            res.type('json').status(201).send({ message: 'No pending found' });
        else {
            res.status(201).json(documents);
        }
    } catch (err) {
        res.type('json').status(500).send({ message: 'No pending found' });
    }


});

app.post('/pending/accept', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('Covoitu');
        const { trip_id, passenger_id } = req.body;

        // Remove the passenger from the passengers array in the corresponding trip document
        const filter = { trip_id: new ObjectId(trip_id) };
        const update = { $pull: { passengers: { passenger_id: new ObjectId(passenger_id) } } };
        const result = await db.collection('pending').updateOne(filter, update);

        // If no document was updated, return an error
        if (result.matchedCount === 0) {
            return res.status(404).send('No pending found');
        }

        // Add the passenger to the passengers array in the corresponding trip document
        const filter2 = { _id: new ObjectId(trip_id) };
        const update2 = { $push: { passengers: { passenger_id: new ObjectId(passenger_id) } } };
        const result2 = await db.collection('trip').updateOne(filter2, update2);

        // If no document was updated, return an error
        if (result2.matchedCount === 0) {
            return res.status(404).send('No trip found');
        }

        // Check if there are any pending passengers left for this trip
        const pendingTrip = await db.collection('pending').findOne({ trip_id: new ObjectId(trip_id) });

        // If there are no more pending passengers, delete the pending document
        if (!pendingTrip || pendingTrip.passengers.length === 0) {
            await db.collection('pending').deleteOne({ trip_id: new ObjectId(trip_id) });
        }

        // Send a success response
        res.type('json').status(201).send({ message: 'Passenger accepted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error ' + err);
    }
});

app.post('/pending/reject', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('Covoitu');
        const { trip_id, passenger_id } = req.body;

        // Remove the passenger from the passengers array in the corresponding trip in the pending collection
        const filter = { trip_id: new ObjectId(trip_id) };
        const update = { $pull: { passengers: { passenger_id: new ObjectId(passenger_id) } } };
        const result = await db.collection('pending').updateOne(filter, update);

        // If no document was updated, return an error
        if (result.matchedCount === 0) {
            return res.status(404).send('No pending found');
        }

        // Check if there are any pending passengers left for this trip
        const pendingTrip = await db.collection('pending').findOne({ trip_id: new ObjectId(trip_id) });

        // If there are no more pending passengers, delete the pending document
        if (!pendingTrip || pendingTrip.passengers.length === 0) {
            await db.collection('pending').deleteOne({ trip_id: new ObjectId(trip_id) });
        }

        // Send a success response
        res.type('json').status(201).send({ message: 'Pending rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error ' + err);
    }
});


app.post('/usersimple', authenticateToken, async (req, res) => {
    const { ids } = req.body;

    try {
        // Connect to the database and get the user collection
        const db = client.db('Covoitu');
        const userCollection = db.collection('user');

        // Convert the IDs to ObjectIDs
        const objectIds = ids.map(id => new ObjectId(id));
        // Get the users from the database
        const users = await userCollection.find({ _id: { $in: objectIds } }).toArray();
        // Return the user information
        res.json(users.map(user => ({ id: user._id, name: user.name, firstname: user.firstname })));
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).send('Error connecting to database');
    }
});


app.post('/trip/:id/book', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const db = client.db('Covoitu');
        const trip = await db.collection('trip').findOne({ _id: new ObjectId(id) });

        if (!trip) {
            return res.status(404).send('trip not found');
        }

        if (trip.driver.toString() === new ObjectId(userId)) {
            return res.status(400).send('Driver cannot book a seat in their own trip');
        }

        // Check if the trip is full
        if (trip.passengers.length >= trip.seats) {
            return res.status(400).send('trip is full');
        }

        // Check if the user is already in the trip
        if (trip.passengers.some(passenger => passenger.passenger_id.toString() === new ObjectId(userId))) {
            return res.status(400).send('User is already in the trip');
        }

        // Check if the user is already in pending
        const pendingTrip = await db.collection('pending').findOne({ trip_id: new ObjectId(id), 'passengers.passenger_id': new ObjectId(userId) });

        if (pendingTrip) {
            return res.status(400).send('User is already in pending');
        }

        // Check if there is already a pending document for this trip
        const existingPendingtrip = await db.collection('pending').findOne({ trip_id: new ObjectId(id) });

        if (existingPendingtrip) {
            // Update the existing pending document
            await db.collection('pending').findOneAndUpdate(
                { trip_id: new ObjectId(id) },
                { $push: { passengers: { passenger_id: new ObjectId(userId), booking_date: new Date() } } },
                { returnOriginal: false }
            );
        } else {
            // Add a new pending document
            const newPendingTrip = await db.collection('pending').insertOne({
                trip_id: new ObjectId(id),
                passengers: [{ passenger_id: new ObjectId(userId), booking_date: new Date() }]
            });
        }

        res.json({ message: 'Booking successful' });
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).send('Error connecting to database');
    }
});


app.post('/picture', authenticateToken, upload.single('file'), async (req, res) => {
    console.log('File upload request received:', req.file);
  
    const file = req.file;
  
    try {
      const db = client.db('Covoitu');
      const user = await db.collection('user').findOne({ _id: new ObjectId(req.user._id) });
  
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      user.profilePicture = file.path;
  
      const result = await db.collection('user').findOneAndUpdate(
        { _id: new ObjectId(req.user._id) },
        { $set: user },
        { returnOriginal: false }
      );
  
      res.status(200).json("User updated");
    } catch (err) {
      console.error('Error during file upload:', err);
      res.status(500).send('Error during file upload');
    }
  });


async function authenticateToken(req, res, next) {
    const token = req.cookies.auth;
    if (!token) {
        return res.sendStatus(401);
    }

    try {
        await client.connect();
        const db = client.db('Covoitu');

        const payload = jwt.verify(token, config.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
        const user = await db.collection('user').findOne({ _id: new ObjectId(payload.id) });
        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).send({ error: 'Unauthorized' });
    }
}


async function forwardGeocode(city) {
    const apiKey = config.API_KEY;
    const url = `http://api.positionstack.com/v1/forward?access_key=${apiKey}&query=${city}&limit=1&output=json`;

    return new Promise((resolve, reject) => {
        http.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                const result = JSON.parse(data);
                if (result && result.data && result.data.length > 0) {
                    const lat = result.data[0].latitude;
                    const lng = result.data[0].longitude;
                    const coords = [lat, lng];
                    resolve(coords);
                } else {
                    reject(new Error('Geocoding failed'));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}




app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
