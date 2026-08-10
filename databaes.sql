DROP DATABASE IF EXISTS pet_adoption_db;
CREATE DATABASE IF NOT EXISTS pet_adoption_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE pet_adoption_db;


CREATE TABLE IF NOT EXISTS users (
    user_id  INT AUTO_INCREMENT PRIMARY KEY,
	email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL ,
    fullname VARCHAR(100) NOT NULL ,
    username VARCHAR(50) NOT NULL UNIQUE,
	phonenumber VARCHAR(15),
    line_id VARCHAR(50),
    role ENUM('user','poster','admin') NOT NULL ,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

SELECT * FROM users;

INSERT IGNORE INTO users
(user_id,email,password,fullname,username,phonenumber,line_id,role)
VALUES
(
	1,
	'Admin@gmail.com',
	'admin123456',
	'ผู้ดูแลระบบ',
	'Admin',
	'0888888888',
	'adminhome',
	'admin'
),
(
	2,
    'poster1@gmail.com',
    '123456',
    'สมหญิง รักแมว',
    'somying',
    '0811111111',
    'somying_cat',
    'poster'
),
(
    3,
    'poster2@gmail.com',
    '123456',
    'กานต์พิชชา ใจดี',
    'kanpitcha',
    '0822222222',
    'kanpitcha_cat',
    'poster'
),
(
    4,
    'adopter1@gmail.com',
    '123456',
    'สมชาย พร้อมเลี้ยง',
    'somchai',
    '0833333333',
    'somchai_home',
    'user'
),
(
    5,
    'adopter2@gmail.com',
    '123456',
    'นันทนา รักสัตว์',
    'nantana',
    '0844444444',
    'nantana_pet',
    'user'
);


-- 1. อัปเดตเปลี่ยนไอดีที่เคยเป็น poster ให้กลายเป็น user ทั้งหมด
UPDATE users 
SET role = 'user' 
WHERE role = 'poster';

-- 2. แก้ไขโครงสร้างตาราง users ให้ตัด 'poster' ออกจาก ENUM
ALTER TABLE users 
MODIFY COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user';

CREATE TABLE IF NOT EXISTS user_profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    living_space_type ENUM(
        'house',
        'condo',
        'apartment'
    ),
    space_size ENUM(
        'small',
        'medium',
        'large'
    ),
	max_monthly_budget DECIMAL(10,2),
	daily_free_hours numeric,
    has_other_pets BOOLEAN,
	has_children BOOLEAN,
    experience ENUM(
        'none',
        'beginner',
        'experienced'
    ),
    FOREIGN KEY(user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

SELECT * FROM user_profiles;


INSERT IGNORE INTO user_profiles
(
	profile_id,
    user_id,
    living_space_type,
    space_size,
    max_monthly_budget,
    daily_free_hours,
    has_other_pets,
    has_children,
    experience
)
VALUES
(
	1,
    4,
    'house',
    'medium',
    5000.00,
    5,
    0,
    0,
    'experienced'
),
(
	2,
    5,
    'condo',
    'small',
    3000.00,
    3,
    1,
    0,
    'beginner'
);



CREATE TABLE IF NOT EXISTS cats (
    cat_id INT AUTO_INCREMENT PRIMARY KEY,
    poster_id INT NOT NULL,
    pet_name VARCHAR(100),
    pet_breed VARCHAR(100),
    gender ENUM('male','female'),
    age_months numeric,
    is_sterilized VARCHAR(100),
    is_vaccinated VARCHAR(100),
	personality TEXT,
    health_note TEXT,
    req_space_level ENUM(
        'small',
        'medium',
        'large',
        'low',
        'high'
    ),
    req_attention ENUM(
        'small',
        'medium',
        'large',
        'low',
        'high'
    ),
    status ENUM(
        'available',
        'pending',
        'adopted'
    ) DEFAULT 'available',
    est_monthly_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (poster_id)
	REFERENCES users(user_id)
);

SELECT * FROM cats;


INSERT IGNORE INTO cats
(
    cat_id,
    poster_id,
    pet_name,
    pet_breed,
    gender,
    age_months,
    is_sterilized,
    is_vaccinated,
    personality,
    health_note,
    req_space_level,
    req_attention,
    status,
    est_monthly_cost
)
VALUES
(
    1,
    2,
    'มะลิ',
    'ไทยผสม',
    'female',
    18,
    1,
    1,
    'ขี้อ้อน เป็นมิตร และชอบอยู่ใกล้คน',
    'สุขภาพแข็งแรง ไม่มีโรคประจำตัว',
    'small',
    'medium',
    'available',
    1800.00
),
(
    2,
    2,
    'ส้มจี๊ด',
    'ไทย',
    'male',
    10,
    0,
    1,
    'ร่าเริง ขี้เล่น และเข้ากับคนง่าย',
    'ยังไม่ได้ทำหมัน',
    'small',
    'high',
    'available',
    2000.00
),
(
    3,
    3,
    'โมจิ',
    'เปอร์เซียผสม',
    'female',
    30,
    1,
    1,
    'เรียบร้อย ไม่ส่งเสียงดัง และชอบอยู่เงียบ ๆ',
    'ต้องแปรงขนเป็นประจำ',
    'medium',
    'medium',
    'available',
    2800.00
),
(
    4,
    3,
    'ถุงเงิน',
    'ไทยผสม',
    'male',
    48,
    1,
    1,
    'อ่อนโยนและคุ้นเคยกับเด็ก',
    'ต้องรับประทานอาหารควบคุมน้ำหนัก',
    'medium',
    'low',
    'pending',
    2200.00
);

ALTER TABLE cats
ADD COLUMN good_with_children BOOLEAN DEFAULT TRUE,
ADD COLUMN good_with_cats BOOLEAN DEFAULT TRUE,
ADD COLUMN good_with_dogs BOOLEAN DEFAULT TRUE,
ADD COLUMN has_special_needs BOOLEAN DEFAULT FALSE;





CREATE TABLE IF NOT EXISTS catphotos (
    photo_id INT AUTO_INCREMENT PRIMARY KEY,
    cat_id INT NOT NULL,
    image_url TEXT,
    FOREIGN KEY(cat_id)
    REFERENCES cats(cat_id)
    ON DELETE CASCADE
);
SELECT * FROM catphotos;

INSERT IGNORE INTO catphotos
(
    photo_id,
    cat_id,
    image_url
)
VALUES
(
    1,
    1,
    'https://example.com/images/mali-1.jpg'
),
(
    2,
    1,
    'https://example.com/images/mali-2.jpg'
),
(
    3,
    2,
    'https://example.com/images/somjeed-1.jpg'
),
(
    4,
    3,
    'https://example.com/images/mochi-1.jpg'
),
(
    5,
    4,
    'https://example.com/images/thungngoen-1.jpg'
);



CREATE TABLE IF NOT EXISTS adoptionapplications (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    cat_id INT NOT NULL,
    applicant_id INT NOT NULL,
    matchscore numeric,
    status ENUM(
        'pending',
        'interview',
        'approved',
        'rejected'
    ) DEFAULT 'pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    upload_remark VARCHAR(255),
    
    FOREIGN KEY (cat_id)
	REFERENCES cats(cat_id),

    FOREIGN KEY (applicant_id)
	REFERENCES users(user_id)
);

SELECT * FROM adoptionapplications;

INSERT IGNORE INTO adoptionapplications
(
    match_id,
    cat_id,
    applicant_id,
    matchscore,
    status,
    upload_remark
)
VALUES
(
    1,
    1,
    4,
    90,
    'pending',
    'มีความพร้อมและต้องการรับมะลิไปเลี้ยงภายในบ้าน'
),
(
    2,
    3,
    5,
    68,
    'interview',
    'ต้องการสอบถามรายละเอียดการดูแลขนของโมจิเพิ่มเติม'
);




CREATE TABLE IF NOT EXISTS adoption_approvals (
    approval_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    approver_id INT NOT NULL,
    approver_status ENUM(
        'waiting',
        'approved',
        'rejected'
    ) DEFAULT 'waiting',
    approver_remark TEXT,
    verified_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(match_id)
    REFERENCES adoptionapplications(match_id),
    
    FOREIGN KEY(approver_id)
    REFERENCES users(user_id)
);

SELECT * FROM adoption_approvals;

INSERT IGNORE INTO adoption_approvals
(
    approval_id,
    match_id,
    approver_id,
    approver_status,
    approver_remark
)
VALUES
(
    1,
    2,
    3,
    'approved',
    'ผู้ขอรับเลี้ยงมีความพร้อมเบื้องต้น นัดพูดคุยรายละเอียดเพิ่มเติม'
);




CREATE TABLE IF NOT EXISTS evaluation_criteria (
    criteria_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    profile_field VARCHAR(50),
    condition_value VARCHAR(100),
    scoreweight INT,
    updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_id)
	REFERENCES users(user_id)
);
SELECT * FROM evaluation_criteria;

ALTER TABLE evaluation_criteria
ADD COLUMN criteria_code VARCHAR(50) AFTER criteria_id,
ADD COLUMN criteria_name VARCHAR(100) AFTER criteria_code,
ADD COLUMN criteria_type ENUM('score', 'rule') DEFAULT 'score',
ADD COLUMN comparison_type ENUM(
    'level',
    'ratio',
    'boolean',
    'exact'
) DEFAULT 'exact',
ADD COLUMN score_ratio DECIMAL(5,2) DEFAULT 0,
ADD COLUMN max_score DECIMAL(5,2) DEFAULT 25,
ADD COLUMN is_blocking BOOLEAN DEFAULT FALSE,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE evaluation_criteria
DROP COLUMN scoreweight;

ALTER TABLE evaluation_criteria
ADD CONSTRAINT uq_criteria_condition
UNIQUE (criteria_code, condition_value);

INSERT IGNORE INTO evaluation_criteria
(
    criteria_code,
    criteria_name,
    admin_id,
    profile_field,
    condition_value,
    criteria_type,
    comparison_type,
    score_ratio,
    max_score,
    is_blocking,
    is_active
)
VALUES

-- 1. SPACE : พื้นที่
(
    'SPACE',
    'พื้นที่ในการเลี้ยง',
    1,
    'space_level',
    'equal_or_higher',
    'score',
    'level',
    1.00,
    25,
    0,
    1
),

(
    'SPACE',
    'พื้นที่ในการเลี้ยง',
    1,
    'space_level',
    'lower_one_level',
    'score',
    'level',
    0.50,
    25,
    0,
    1
),

(
    'SPACE',
    'พื้นที่ในการเลี้ยง',
    1,
    'space_level',
    'lower_two_levels',
    'score',
    'level',
    0.00,
    25,
    1,
    1
),


-- 2. BUDGET : งบประมาณ
(
    'BUDGET',
    'งบประมาณต่อเดือน',
    1,
    'monthly_budget',
    'ratio_gte_1',
    'score',
    'ratio',
    1.00,
    25,
    0,
    1
),

(
    'BUDGET',
    'งบประมาณต่อเดือน',
    1,
    'monthly_budget',
    'ratio_080_099',
    'score',
    'ratio',
    0.70,
    25,
    0,
    1
),

(
    'BUDGET',
    'งบประมาณต่อเดือน',
    1,
    'monthly_budget',
    'ratio_060_079',
    'score',
    'ratio',
    0.30,
    25,
    0,
    1
),

(
    'BUDGET',
    'งบประมาณต่อเดือน',
    1,
    'monthly_budget',
    'ratio_lt_060',
    'score',
    'ratio',
    0.00,
    25,
    1,
    1
),


-- 3. ATTENTION : เวลาในการดูแล
(
    'ATTENTION',
    'เวลาในการดูแล',
    1,
    'attention_level',
    'equal_or_higher',
    'score',
    'level',
    1.00,
    25,
    0,
    1
),

(
    'ATTENTION',
    'เวลาในการดูแล',
    1,
    'attention_level',
    'lower_one_level',
    'score',
    'level',
    0.50,
    25,
    0,
    1
),

(
    'ATTENTION',
    'เวลาในการดูแล',
    1,
    'attention_level',
    'lower_two_levels',
    'score',
    'level',
    0.00,
    25,
    1,
    1
),


-- 4. EXPERIENCE : ประสบการณ์
(
    'EXPERIENCE',
    'ประสบการณ์ในการเลี้ยง',
    1,
    'experience_level',
    'equal_or_higher',
    'score',
    'level',
    1.00,
    25,
    0,
    1
),

(
    'EXPERIENCE',
    'ประสบการณ์ในการเลี้ยง',
    1,
    'experience_level',
    'lower_one_level',
    'score',
    'level',
    0.50,
    25,
    0,
    1
),

(
    'EXPERIENCE',
    'ประสบการณ์ในการเลี้ยง',
    1,
    'experience_level',
    'lower_two_levels',
    'score',
    'level',
    0.00,
    25,
    1,
    1
);


CREATE TABLE IF NOT EXISTS assessments (
    assessment_id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_id INT NOT NULL,
    cat_id INT NOT NULL,

    total_score DECIMAL(5,2) NOT NULL,
    suitability_level ENUM(
        'highly_suitable',
        'suitable',
        'consider',
        'not_suitable'
    ) NOT NULL,

    recommendation TEXT,
    assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assessment_applicant
        FOREIGN KEY (applicant_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_assessment_cat
        FOREIGN KEY (cat_id)
        REFERENCES cats(cat_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

SELECT * FROM assessments;

INSERT IGNORE INTO assessments
(
    assessment_id,
    applicant_id,
    cat_id,
    total_score,
    suitability_level,
    recommendation
)
VALUES
(
    1,
    4,
    1,
    90.00,
    'highly_suitable',
    'มีที่พัก เวลา งบประมาณ และประสบการณ์เหมาะสมกับการดูแลมะลิ'
),
(
    2,
    5,
    3,
    68.00,
    'suitable',
    'สามารถรับเลี้ยงได้ แต่ควรเตรียมเวลาและงบประมาณสำหรับการดูแลขนเพิ่มเติม'
);

ALTER TABLE assessments
ADD COLUMN match_percentage DECIMAL(5,2) AFTER total_score,
ADD COLUMN eligible BOOLEAN DEFAULT TRUE AFTER suitability_level,
ADD COLUMN criteria_version VARCHAR(50) AFTER eligible;

DESCRIBE assessments;

SHOW COLUMNS FROM assessments;

CREATE TABLE IF NOT EXISTS assessment_details (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    criteria_id INT NOT NULL,

    actual_value VARCHAR(100),
    score_received DECIMAL(5,2) NOT NULL,
    explanation VARCHAR(255),

    CONSTRAINT fk_detail_assessment
        FOREIGN KEY (assessment_id)
        REFERENCES assessments(assessment_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_detail_criteria
        FOREIGN KEY (criteria_id)
        REFERENCES evaluation_criteria(criteria_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

SELECT * FROM assessment_details;

ALTER TABLE assessment_details
DROP COLUMN actual_value;

ALTER TABLE assessment_details
ADD COLUMN applicant_value VARCHAR(100) AFTER criteria_id,
ADD COLUMN required_value VARCHAR(100) AFTER applicant_value,
ADD COLUMN weight_used DECIMAL(5,2) AFTER required_value,
ADD COLUMN score_ratio_used DECIMAL(5,2) AFTER weight_used,
ADD COLUMN max_score DECIMAL(5,2) AFTER score_ratio_used,
ADD COLUMN stars DECIMAL(2,1) AFTER score_received,
ADD COLUMN passed BOOLEAN DEFAULT TRUE AFTER stars;




SELECT
    c.cat_id,
    c.pet_name AS cat_name,
    c.pet_breed,
    c.status,
    u.fullname AS poster_name,
    u.phonenumber AS poster_phone
FROM cats AS c
JOIN users AS u
    ON c.poster_id = u.user_id;
    
    
    
SELECT
    u.user_id,
    u.fullname,
    p.living_space_type,
    p.max_monthly_budget,
    p.daily_free_hours,
    p.experience
FROM users AS u
JOIN user_profiles AS p
    ON u.user_id = p.user_id;
    
    
    
    
SELECT
    aa.match_id,
    c.pet_name AS cat_name,
    applicant.fullname AS applicant_name,
    poster.fullname AS poster_name,
    aa.matchscore,
    aa.status,
    aa.applied_at
FROM adoptionapplications AS aa
JOIN cats AS c
    ON aa.cat_id = c.cat_id
JOIN users AS applicant
    ON aa.applicant_id = applicant.user_id
JOIN users AS poster
    ON c.poster_id = poster.user_id;
    
    
    
SELECT *
FROM cats
WHERE status = 'available';


SELECT *
FROM cats
ORDER BY age_months;


SELECT status, COUNT(*) AS total
FROM cats
GROUP BY status;


SELECT
u.fullname,
COUNT(c.cat_id) AS total_cat
FROM users u
JOIN cats c
ON u.user_id = c.poster_id
GROUP BY u.fullname;


DESCRIBE users;

DESCRIBE cats;

DESCRIBE catphotos;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE assessments;
TRUNCATE TABLE evaluation_criteria;

SET FOREIGN_KEY_CHECKS = 1;




-- ระบบแชท

CREATE TABLE IF NOT EXISTS conversations (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (match_id) 
    REFERENCES adoptionapplications(match_id)
    ON DELETE CASCADE
);

SELECT * FROM conversations;

INSERT IGNORE INTO conversations (room_id, match_id) 
VALUES 
(1, 1), -- แชทสำหรับการขอรับเลี้ยงแมว 'มะลิ' (match_id = 1)
(2, 2); -- แชทสำหรับการขอรับเลี้ยงแมว 'โมจิ' (match_id = 2)


CREATE TABLE IF NOT EXISTS messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (room_id) 
    REFERENCES conversations(room_id)
    ON DELETE CASCADE,
    
    FOREIGN KEY (sender_id) 
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

SELECT * FROM messages;

INSERT IGNORE INTO messages (message_id, room_id, sender_id, message_text, is_read, sent_at)
VALUES
-- ห้องแชท 1 (match_id 1: มะลิ, Applicant = สมชาย(4), Poster = สมหญิง(2))
(1, 1, 4, 'สวัสดีครับ ผมสนใจรับเลี้ยงน้องมะลิครับ พอดีมีคำถามนิดหน่อยครับ', TRUE, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 1, 2, 'สวัสดีค่ะ ยินดีค่ะ สอบถามได้เลยนะคะ น้องมะลิขี้อ้อนมากค่ะ', TRUE, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 1, 4, 'อาหารที่น้องกินประจำคือยี่ห้ออะไรหรอครับ?', FALSE, NOW()),

-- ห้องแชท 2 (match_id 2: โมจิ, Applicant = นันทนา(5), Poster = กานต์พิชชา(3))
(4, 2, 5, 'สวัสดีค่ะ น้องโมจิยังมีคนจองหรือยังคะ?', TRUE, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(5, 2, 3, 'ยังว่างอยู่ค่ะ นัดเข้ามาดูตัวน้องก่อนได้นะคะ', FALSE, DATE_SUB(NOW(), INTERVAL 5 MINUTE));

DESCRIBE conversations;
DESCRIBE messages;