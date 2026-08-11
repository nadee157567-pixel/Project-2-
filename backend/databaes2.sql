DROP DATABASE IF EXISTS pet_adoption_db;
CREATE DATABASE pet_adoption_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE pet_adoption_db;


CREATE TABLE users (
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

INSERT INTO users
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
);

-- 1. อัปเดตเปลี่ยนไอดีที่เคยเป็น poster ให้กลายเป็น user ทั้งหมด
UPDATE users 
SET role = 'user' 
WHERE role = 'poster';

-- 2. แก้ไขโครงสร้างตาราง users ให้ตัด 'poster' ออกจาก ENUM
ALTER TABLE users 
MODIFY COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user';

CREATE TABLE user_profiles (
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


-- default profiles removed



CREATE TABLE cats (
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
        'large'
    ),
    req_attention ENUM(
        'low',
        'medium',
        'high'
    ),
    req_experience_level ENUM(
        'low',
        'medium',
        'high'
    ) DEFAULT 'low',
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


-- default cats removed

ALTER TABLE cats
ADD COLUMN good_with_children BOOLEAN DEFAULT TRUE,
ADD COLUMN good_with_cats BOOLEAN DEFAULT TRUE,
ADD COLUMN good_with_dogs BOOLEAN DEFAULT TRUE,
ADD COLUMN has_special_needs BOOLEAN DEFAULT FALSE;





CREATE TABLE catphotos (
    photo_id INT AUTO_INCREMENT PRIMARY KEY,
    cat_id INT NOT NULL,
    image_url TEXT,
    FOREIGN KEY(cat_id)
    REFERENCES cats(cat_id)
    ON DELETE CASCADE
);
SELECT * FROM catphotos;

-- default catphotos removed



CREATE TABLE adoptionapplications (
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

-- default applications removed




CREATE TABLE adoption_approvals (
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

-- default approvals removed




CREATE TABLE evaluation_criteria (
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

INSERT INTO evaluation_criteria
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


CREATE TABLE assessments (
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

-- default assessments removed

ALTER TABLE assessments
ADD COLUMN match_percentage DECIMAL(5,2) AFTER total_score,
ADD COLUMN eligible BOOLEAN DEFAULT TRUE AFTER suitability_level,
ADD COLUMN criteria_version VARCHAR(50) AFTER eligible;

DESCRIBE assessments;

SHOW COLUMNS FROM assessments;

CREATE TABLE assessment_details (
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

CREATE TABLE conversations (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (match_id) 
    REFERENCES adoptionapplications(match_id)
    ON DELETE CASCADE
);

SELECT * FROM conversations;

-- default conversations removed -- แชทสำหรับการขอรับเลี้ยงแมว 'โมจิ' (match_id = 2)


CREATE TABLE messages (
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

-- default messages removed

DESCRIBE conversations;
DESCRIBE messages;