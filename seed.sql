-- Database seeding script for KumbhAarambh (Nashik Simhastha Mela)
-- Paste this script directly inside the Supabase SQL Editor to initialize all tables and seed data.

-- 1. STAYS TABLE
CREATE TABLE IF NOT EXISTS stays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT CHECK (category IN ('matha', 'homestay', 'guesthouse')),
    price TEXT NOT NULL,
    address TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    rating DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    amenities TEXT[] NOT NULL DEFAULT '{}',
    "desc" TEXT NOT NULL,
    verified_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stay_id UUID REFERENCES stays(id) ON DELETE CASCADE,
    stay_title TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    check_in DATE NOT NULL,
    timestamp TEXT NOT NULL,
    acknowledged BOOLEAN NOT NULL DEFAULT false
);

-- 3. FOOD SPOTS TABLE
CREATE TABLE IF NOT EXISTS food_spots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('bhandara', 'restaurant', 'sweets')),
    price TEXT NOT NULL,
    address TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    rating DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    likes INT NOT NULL DEFAULT 0,
    specialty TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    verified_count INT NOT NULL DEFAULT 0
);

-- 4. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spot_id TEXT NOT NULL,
    reviewer TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    date TEXT NOT NULL
);

-- 5. GHATS TABLE
CREATE TABLE IF NOT EXISTS ghats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    crowd_level TEXT CHECK (crowd_level IN ('LOW', 'MODERATE', 'HIGH')),
    flag_color TEXT CHECK (flag_color IN ('GREEN', 'YELLOW', 'RED')),
    "desc" TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    flow_speed TEXT NOT NULL,
    last_updated TEXT NOT NULL
);

-- 6. OVERCHARGE REPORTS TABLE
CREATE TABLE IF NOT EXISTS overcharge_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_number TEXT NOT NULL,
    charged_fare INT NOT NULL,
    official_fare INT NOT NULL,
    route TEXT NOT NULL,
    vehicle TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- 7. LOST ITEMS TABLE
CREATE TABLE IF NOT EXISTS lost_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location_name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    image_url TEXT,
    reporter_name TEXT NOT NULL,
    reporter_role TEXT NOT NULL CHECK (reporter_role IN ('YATRI', 'NASHIKKAR')),
    status TEXT NOT NULL DEFAULT 'LOST' CHECK (status IN ('LOST', 'FOUND', 'CLAIMED')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime subscriptions for all tables (safe drop-and-readd to avoid duplicate membership errors)
alter publication supabase_realtime drop table if exists stays, bookings, food_spots, reviews, ghats, overcharge_reports, lost_items;
alter publication supabase_realtime add table stays, bookings, food_spots, reviews, ghats, overcharge_reports, lost_items;

-- Enable RLS on all tables
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghats ENABLE ROW LEVEL SECURITY;
ALTER TABLE overcharge_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;

-- Public READ access for all tables (anyone can view)
CREATE POLICY "Public read stays" ON stays FOR SELECT USING (true);
CREATE POLICY "Public read bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Public read food_spots" ON food_spots FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public read ghats" ON ghats FOR SELECT USING (true);
CREATE POLICY "Public read overcharge_reports" ON overcharge_reports FOR SELECT USING (true);
CREATE POLICY "Public read lost_items" ON lost_items FOR SELECT USING (true);

-- Public INSERT access for user-submitted data
CREATE POLICY "Public insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert overcharge_reports" ON overcharge_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert stays" ON stays FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert food_spots" ON food_spots FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert lost_items" ON lost_items FOR INSERT WITH CHECK (true);

-- Public UPDATE for ghats (crowd status updates from Nashikkar)
CREATE POLICY "Public update ghats" ON ghats FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public update bookings" ON bookings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public update lost_items" ON lost_items FOR UPDATE USING (true) WITH CHECK (true);

-- Clean existing seeds (optional but safe)
TRUNCATE TABLE stays CASCADE;
TRUNCATE TABLE food_spots CASCADE;
TRUNCATE TABLE ghats CASCADE;
TRUNCATE TABLE lost_items CASCADE;


-- SEED GHATS
INSERT INTO ghats (id, name, crowd_level, flag_color, "desc", lat, lng, flow_speed, last_updated) VALUES
('ghat-1', 'Ram Kund (Main Ghat)', 'HIGH', 'RED', 'Holy spot of Asthi Visarjan. High crowd density due to auspicious bathing hour. RTO restrictions active.', 20.0092, 73.7915, '1.2 m/s (Fast)', '5 mins ago'),
('ghat-2', 'Talkuteshwar Ghat', 'MODERATE', 'YELLOW', 'Bathing ghat downstream. Moderate crowds. Ideal for families looking for peaceful holy dip.', 20.0158, 73.7995, '0.8 m/s (Moderate)', '12 mins ago'),
('ghat-3', 'Lakshman Kund', 'LOW', 'GREEN', 'Spacious bathing site with dedicated volunteers and security barricades. Highly recommended.', 20.0078, 73.7885, '0.5 m/s (Calm)', '20 mins ago'),
('ghat-4', 'Kushavarta Kund', 'HIGH', 'RED', 'The sacred source of the Godavari river in Trimbakeshwar. Extremely crowded during Shahi Snan.', 19.9324, 73.5303, '0.2 m/s (Still)', '10 mins ago'),
('ghat-5', 'Ahilya Godavari Sangam Ghat', 'MODERATE', 'YELLOW', 'Confluence of rivers. Great alternative for pilgrims wanting to avoid the Ram Kund rush.', 20.0069, 73.7850, '0.9 m/s (Moderate)', '15 mins ago'),
('ghat-6', 'Someshwar Ghat', 'LOW', 'GREEN', 'Serene bathing spot near Someshwar Temple. Scenic, clean, and highly secure for elderly.', 19.9855, 73.7310, '0.6 m/s (Calm)', '1 hour ago'),
('ghat-7', 'Sita Kund', 'LOW', 'GREEN', 'A quiet, sacred pool situated near Sita Gufa in Tapovan. Frequented by devotees looking for serene prayers.', 20.0135, 73.7858, '0.3 m/s (Still)', '15 mins ago'),
('ghat-8', 'Surya Kund', 'MODERATE', 'YELLOW', 'Bathing pond dedicated to the Sun God. Located downstream on the Panchavati riverbanks.', 20.0098, 73.7930, '0.7 m/s (Moderate)', '30 mins ago'),
('ghat-9', 'Ahilya Kund', 'LOW', 'GREEN', 'Sacred tank near the main Godavari flow named after Queen Ahilyabai Holkar. Clean and well-barricaded.', 20.0089, 73.7908, '0.4 m/s (Calm)', '45 mins ago'),
('ghat-10', 'Gautama Kund', 'MODERATE', 'YELLOW', 'Sacred pond near Trimbakeshwar Temple. Believed to be where Sage Gautama performed penance to bring the Godavari down.', 19.9332, 73.5315, '0.2 m/s (Still)', '10 mins ago');

-- SEED FOOD SPOTS (Street stalls, Chaat corners, Thalis, and Restaurants)
INSERT INTO food_spots (name, category, price, address, lat, lng, rating, likes, specialty, "desc", verified_count) VALUES
('Shree Swaminarayan Mandir Dining Hall', 'bhandara', 'Free (Prasad)', 'Shree Swaminarayan Mandir, Panchavati, Nashik', 20.0105, 73.7932, 4.9, 312, 'Pure Veg Satvik Mahaprasad', 'A massive community kitchen run by the Swaminarayan Temple Trust, offering free pure veg meals and clean drinking water to all pilgrims.', 45),
('Sadhana Restaurant', 'restaurant', '₹120 / plate', 'Someshwar Temple Road, Gangapur, Nashik', 19.9990, 73.7240, 4.8, 420, 'Chulivarchi Misal Pav', 'Traditional wood-fired Maharashtrian spicy curry topped with farsan, served with hot pav. Set in a scenic village-themed garden near Someshwar waterfall.', 28),
('Panchavati Gaurav Pure Veg', 'restaurant', '₹250 / thali', 'Near Pramod Mahajan Garden, College Road, Nashik', 20.0035, 73.7780, 4.6, 198, 'Unlimited Maharashtrian Thali', 'Subsidized thali containing dynamic varieties of local curries, dal, varan bhat, and hot puran polis served with dollops of pure ghee.', 19),
('Krishna Vijay Halwai Sweet Mart', 'sweets', '₹60 / plate', 'Kapaleshwar Mandir Chowk, Panchavati, Nashik', 20.0102, 73.7912, 4.7, 245, 'Saffron Jalebi & Rabdi', 'A legendary sweet corner right next to Kapaleshwar temple. Famous for its thick, saffron-infused crispy jalebis and chilled rabdi.', 32),
('Bapu Ki Misal', 'restaurant', '₹100 / plate', 'Nashik Road, Nashik', 19.9650, 73.8150, 4.8, 380, 'Authentic Nashik Misal', 'Extremely popular misal joint famous for its spicy and flavorful rassa (gravy).', 56),
('Modern Cafe', 'restaurant', '₹150 / plate', 'College Road, Near BYK College, Nashik', 20.0068, 73.7635, 4.6, 210, 'Veg Hakka Noodles & Manchurian', 'Highly popular hangout spot on College Road, widely known for serving some of the best street-style Indo-Chinese and fast food in Nashik.', 12),
('Nandan Sweets', 'sweets', '₹50 / piece', 'Panchavati, Nashik', 20.0100, 73.7900, 4.6, 185, 'Pedhas & Milk Sweets', 'One of the oldest sweet shops offering pure milk-based sweets, great for carrying as Prasad.', 8),
('Gajanan Maharaj Prasadalaya', 'bhandara', 'Free (Prasad)', 'Trimbakeshwar, Nashik', 19.9350, 73.5350, 5.0, 540, 'Varan Bhaat Prasad', 'A mega free kitchen feeding thousands of pilgrims daily with utmost hygiene and devotion.', 89),
('Shreeji Chat & Sandwiches', 'sweets', '₹80 / plate', 'College Road, Opposite BYK College, Nashik', 20.0065, 73.7622, 4.8, 295, 'Cheese Sev Puri & Dahi Puri', 'Undoubtedly the most popular street chaat and sandwich stall in College Road, frequented by students and families alike for hygienic and highly flavorful street food.', 34),
('Pavan Momo Corner', 'restaurant', '₹70 / plate', 'Krishi Nagar Jogging Track, College Road, Nashik', 20.0072, 73.7608, 4.7, 185, 'Veg Steam & Fried Momos', 'Nashik''s legendary momo joint. Serving piping hot veg steam momos with extra spicy red chutney and hot soup for over a decade.', 22),
('Yashwant Bhel & Chaat', 'sweets', '₹50 / plate', 'Near Yashwant Maharaj Mandir, Panchavati, Nashik', 20.0085, 73.7905, 4.9, 312, 'Oli Bhel & Sukhi Bhel', 'A famous streetside cart serving authentic spicy Nashik-style bhel and sev dahi puri. Located close to Ram Kund.', 57),
('Budha Halwai', 'sweets', '₹100 / plate', 'Bhadrakali Fruit Market, Bhadrakali, Nashik', 20.0020, 73.7885, 4.9, 410, 'Pure Ghee Jalebi & Rabdi', 'The oldest and most iconic sweet shop in Nashik (since 1920), famous for their piping hot pure ghee jalebis served with thick creamy rabdi.', 94),
('Rajdoot Chinese Corner', 'restaurant', '₹110 / plate', 'Panchavati Karanja, Main Road, Nashik', 20.0090, 73.7840, 4.4, 115, 'Veg Triple Schezwan Rice', 'A highly popular street-style Chinese stall famous for spicy noodles and fried rice in Panchavati.', 14),
('Nandan Chaat Point', 'sweets', '₹60 / plate', 'Someshwar Waterfall Road, Nashik', 19.9860, 73.7290, 4.7, 160, 'Pani Puri & Ragda Pattice', 'Highly hygienic street food stall located near the Someshwar picnic area. Excellent cold pani puri.', 25),
('Kalaram Vada Pav Stall', 'restaurant', '₹20 / plate', 'Near Kalaram Temple East Gate, Panchavati, Nashik', 20.0125, 73.7895, 4.8, 150, 'Garlic Chutney Vada Pav', 'Famous roadside cart serving steaming hot vada pavs with fried green chilies and dry red garlic chutney.', 14),
('Ram Kund Sabudana Khichdi', 'restaurant', '₹40 / plate', 'Ram Kund Steps, Panchavati, Nashik', 20.0094, 73.7918, 4.9, 210, 'Satvik Sabudana Khichdi', 'Legendary morning fast food cart feeding hundreds of pilgrims daily with fresh, hot, satvik khichdi cooked in groundnut oil.', 33),
('Sita Gufa Sugarcane & Juice Center', 'sweets', '₹20 / glass', 'Near Sita Gufa Entrance, Tapovan, Nashik', 20.0138, 73.7865, 4.6, 95, 'Fresh Mint Sugarcane Juice', 'A small wooden stall offering ice-cold, freshly crushed sugarcane juice with ginger and mint to quench pilgrims'' thirst.', 8),
('Shalimar Shev Pav Center', 'restaurant', '₹30 / plate', 'Shalimar Chowk, Nashik Peth, Nashik', 20.0015, 73.7795, 4.5, 120, 'Spicy Shev Pav with Tari', 'A bustling street-side cart known for its unique Nashik specialty: Shev Pav stuffed with spicy chickpea curry and sev.', 18),
('Ravivar Peth Jalebi & Imarti Stall', 'sweets', '₹50 / plate', 'Ravivar Peth Market Chowk, Nashik', 20.0042, 73.7825, 4.7, 135, 'Hot Paneer Jalebi', 'A heritage sweet cart operating since 1955, frying golden crispy paneer jalebis and hot imartis in the evening.', 26),
('Tapovan Tea & Chai Corner', 'sweets', '₹10 / cup', 'Tapovan Road Crossing, Nashik', 20.0145, 73.7950, 4.8, 280, 'Masala Tapri Tea', 'A lively tea tapri serving ginger-cardamom infused milk tea in clay cups (kulhads) to pilgrims and sadhus.', 40),
('Dwarka Chowk Poha Stall', 'restaurant', '₹25 / plate', 'Dwarka Circle, Near Highway Flyover, Nashik', 19.9890, 73.7990, 4.4, 90, 'Kanda Poha & Tarri', 'A morning breakfast stall frequented by travellers arriving early. Serves authentic Nagpur-style Tarri Poha.', 11),
('Bhadrakali Kulfi House', 'sweets', '₹40 / cup', 'Bhadrakali Temple Lane, Nashik', 20.0018, 73.7870, 4.7, 110, 'Matka Malai Kulfi', 'A tiny dessert stall specializing in traditional slow-churned matka kulfi flavored with saffron and pistachios.', 15),
('Trimbakeshwar Tea & Snacks Depot', 'restaurant', '₹30 / plate', 'Kushavarta Kund Entrance, Trimbakeshwar', 19.9328, 73.5306, 4.6, 175, 'Batata Vada & Poori Bhaji', 'A small street stall popular for serving piping hot tea, crispy batata vadas, and subji poori to pilgrims after their holy dip.', 22);

-- SEED STAYS (Ashrams, Mathas, Guesthouses, and Homestays)
INSERT INTO stays (title, category, price, address, lat, lng, rating, amenities, "desc", verified_count) VALUES
('Kailas Math Ashram', 'matha', '₹100 / night (Donation)', 'Panchavati River Road, Ramghat, Nashik', 20.0080, 73.7890, 4.8, '{"Drinking Water", "Meditation Mats", "Community Kitchen", "Satsang Hall"}', 'A revered ashram offering simple dorm accommodations and pure meals. Situated near Kalaram temple and Ramkund on the Godavari banks.', 24),
('Hotel Panchavati Yatri', 'guesthouse', '₹650 / night', 'Panchavati Karanja, Main Road, Nashik', 19.9982, 73.7845, 4.5, '{"Clean Bathrooms", "CCTV Security", "24hr Help Desk", "Filtered Water"}', 'Subsidy-registered rooms for pilgrims. Very close to key transport terminals and the main bathing ghats.', 15),
('Shri Trimbakeshwar Devsthan Yatrik Niwas', 'matha', 'Free / Donation-based', 'Trimbakeshwar Shiva Jyotirlinga Campus, Nashik', 19.9310, 73.5290, 4.9, '{"Hot Water", "Blankets", "Medical Desk", "Safe Locker"}', 'Devotee guest rooms managed directly by the Trimbakeshwar Temple Trust. Features strict veg kitchen guidelines.', 42),
('Ginger Nashik', 'guesthouse', '₹1,200 / night', 'Trimbak Road, Near ITI Phata, Nashik', 20.0195, 73.7655, 4.4, '{"Air Conditioning", "WiFi", "Attached Bath", "Card Payment"}', 'Subsidized standard hotel rooms in central Nashik, offering corporate volunteer hubs and verified security setups.', 8),
('Grape Park Resort MTDC', 'guesthouse', '₹1,800 / night', 'Near Gangapur Dam, Nashik', 19.9950, 73.7050, 4.6, '{"Parking", "Restaurant", "Scenic View", "AC"}', 'A beautiful government-run resort perfect for families looking to stay away from the intense city crowds but near the holy sites.', 12),
('Shree Gajanan Maharaj Mandir Sansthan Dharamshala', 'matha', 'Free / Donation', 'Trimbakeshwar Road, Trimbak', 19.9350, 73.5350, 4.9, '{"Prasad", "Locker Room", "Clean Drinking Water", "Satsang"}', 'Massive charitable complex near Trimbakeshwar offering huge dormitories for pilgrims at subsidized/free costs with pure veg meals.', 89),
('Shree Swami Samarth Gurupeeth (Kendra)', 'matha', '₹200 / night', 'Dindori Road, Near RTO, Nashik', 20.0500, 73.8000, 4.8, '{"Meditation Hall", "Hot Water", "Canteen", "Library"}', 'A highly disciplined spiritual center offering clean and peaceful rooms for pilgrims prioritizing meditation and safety.', 35),
('Hotel ibis Nashik', 'homestay', '₹2,500 / night', 'Trimbakeshwar Road, MIDC, Nashik', 19.9800, 73.7650, 4.5, '{"Free WiFi", "Breakfast", "Secure Entry", "AC"}', 'Modern corporate hotel offering special packages during Kumbh for pilgrims seeking premium comfort.', 6),
('Panchavati Pilgrim Homestay', 'homestay', '₹500 / night', 'Tapovan Road, Near Kalaram Mandir, Nashik', 20.0120, 73.7880, 4.7, '{"Kitchen Access", "Local Host", "Hot Water", "Clean Beds"}', 'A cozy, resident-hosted homestay in Panchavati. Highly secure for families and solo pilgrims alike.', 18),
('Trimbak Valley Homestay', 'homestay', '₹600 / night', 'Kushavarta Road, Trimbakeshwar, Nashik', 19.9340, 73.5320, 4.6, '{"Attached Toilet", "Spiritual Guide Host", "Home Cooked Food"}', 'A local family homestay offering stunning views of Brahmagiri Hills, located walking distance from Kushavarta Kund.', 11),
('Shri Ram Sharan Ashram', 'matha', '₹150 / night', 'Tapovan Road, Near Laxman Rekha, Nashik', 20.0150, 73.7970, 4.7, '{"Drinking Water", "Dormitory Beds", "Common Baths", "Satvik Canteen"}', 'A clean, calm ashram providing low-cost dormitory stays and daily discourses. Ideal for budget pilgrims.', 19),
('Muktidham Yatrik Bhavan', 'matha', '₹250 / night', 'Muktidham Temple Campus, Nashik Road, Nashik', 19.9630, 73.8180, 4.8, '{"Hot Water", "Security", "Temple View", "Spacious Rooms"}', 'Subsidized pilgrim rooms managed directly by the Muktidham Temple Trust. Highly clean and secure environment.', 30),
('Tapovan Hermitage Guest Rooms', 'guesthouse', '₹500 / night', 'Tapovan Forest Lane, Nashik', 20.0165, 73.7925, 4.5, '{"Clean Bathrooms", "Silent Garden", "Ceiling Fan"}', 'Simple, eco-friendly budget rooms situated close to Tapovan. Surrounded by green trees and offering quiet retreat.', 12),
('Kapaleshwar Bhakt Niwas', 'matha', '₹200 / night', 'Kapaleshwar Mandir Road, Panchavati, Nashik', 20.0108, 73.7918, 4.6, '{"Water Filter", "Locker Facility", "Geyser"}', 'Affordable guest rooms near the historic Kapaleshwar Temple. Very convenient for performing morning rituals at Ram Kund.', 25),
('Someshwar Riverside Homestay', 'homestay', '₹800 / night', 'Someshwar Temple Road, Nashik', 19.9865, 73.7320, 4.8, '{"River View", "Home Cooked Food", "WiFi", "Private Balcony"}', 'A cozy riverside homestay operated by a local family. Offers delicious local Maharashtrian breakfast and quiet nights.', 14),
('Trimbakeshwar Shiva Krupa Lodge', 'guesthouse', '₹450 / night', 'Main Bazar Street, Trimbakeshwar', 19.9320, 73.5285, 4.3, '{"Attached Bath", "24hr Water", "Fan"}', 'An economical lodge located just 2 minutes away from Trimbakeshwar Temple. Popular among backpackers and budget travellers.', 21),
('Godavari View Lodge', 'guesthouse', '₹550 / night', 'Panchavati Bridge Road, Nashik', 20.0075, 73.7870, 4.4, '{"Water Purifier", "CCTV Security", "Attached Toilet"}', 'Budget lodge facing the holy Godavari river. Close to all shopping bazaars and local bus stands.', 17),
('Kalaram Heritage Inn', 'homestay', '₹750 / night', 'Wagh Lane, Near Kalaram Temple, Panchavati, Nashik', 20.0118, 73.7892, 4.7, '{"AC Options", "Local Guide", "Clean Linen", "Attached Bath"}', 'A traditional family-run homestay situated in a heritage Nashik wada. Highly praised for warm local hospitality and guide services.', 22);

-- SEED LOST ITEMS
INSERT INTO lost_items (title, description, location_name, lat, lng, image_url, reporter_name, reporter_role, status) VALUES
('Milton Metal Water Flask', 'Left behind a silver Milton stainless steel water flask near the shoe stalls of Ram Kund during morning snan.', 'Ram Kund (Main Ghat)', 20.0092, 73.7915, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80', 'Amit Sharma', 'YATRI', 'LOST'),
('Brass Keyring with 3 Keys', 'Found a bunch of keys on a brass keychain showing a Lord Ganesha emblem near the floral decoration stalls of Talkuteshwar.', 'Talkuteshwar Ghat', 20.0158, 73.7995, 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&q=80', 'Rajesh Patil', 'NASHIKKAR', 'FOUND'),
('Brown Leather Sling Bag', 'Found a brown leather sling bag containing keys, a small notebook, and a pair of reading glasses on the seating benches.', 'Lakshman Kund', 20.0078, 73.7885, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&q=80', 'Sunita Deshmukh', 'YATRI', 'LOST');

