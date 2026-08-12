-- Generated schema.sql from SQLAlchemy models
DROP TABLE IF EXISTS `responses`;
DROP TABLE IF EXISTS `duplicate_flags`;
DROP TABLE IF EXISTS `session_activity_logs`;
DROP TABLE IF EXISTS `section_scores`;
DROP TABLE IF EXISTS `report_statements`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `applicant_registry`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `behavioural_factors`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `assessment_sessions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `forms`;
DROP TABLE IF EXISTS `behavioural_types`;

SET FOREIGN_KEY_CHECKS=1;


CREATE TABLE behavioural_types (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	code VARCHAR(1) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	instructions TEXT, 
	order_index INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_behavioural_type_code UNIQUE (code)
)

;


CREATE TABLE forms (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(255) NOT NULL, 
	is_active BOOL NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id)
)

;


CREATE TABLE users (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(255) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	`role` ENUM('ADMIN','USER') NOT NULL, 
	account_type ENUM('BASIC','EXECUTIVE') NOT NULL, 
	token_version INTEGER NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	education VARCHAR(255), 
	address TEXT, 
	country VARCHAR(100), 
	age INTEGER, 
	profession VARCHAR(255), 
	income_range VARCHAR(100), 
	phone VARCHAR(50), 
	consent_given_at DATETIME, 
	deleted_at DATETIME, 
	anonymized_at DATETIME, 
	retention_expires_at DATETIME, 
	last_accessed_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (email)
)

;


CREATE TABLE assessment_sessions (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER NOT NULL, 
	form_id INTEGER NOT NULL, 
	status ENUM('in_progress','submitted') NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	submitted_at DATETIME, 
	ai_report_data JSON, 
	expires_at DATETIME, 
	prior_attempt_claimed BOOL NOT NULL, 
	prior_attempt_details TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(form_id) REFERENCES forms (id)
)

;


CREATE TABLE audit_logs (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	action ENUM('USER_REGISTER','USER_LOGIN','USER_LOGOUT','DATA_EXPORT','ACCOUNT_DELETE','PASSWORD_RESET_REQUEST','PASSWORD_RESET_COMPLETE','ADMIN_VIEW_USER','ADMIN_VIEW_SESSION','CONSENT_GIVEN','DUPLICATE_FLAGGED','DUPLICATE_REVIEWED') NOT NULL, 
	user_id INTEGER, 
	target_user_id INTEGER, 
	ip_address VARCHAR(45), 
	detail TEXT, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
)

;


CREATE TABLE behavioural_factors (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	behavioural_type_id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	order_index INTEGER NOT NULL, 
	color VARCHAR(7), 
	PRIMARY KEY (id), 
	FOREIGN KEY(behavioural_type_id) REFERENCES behavioural_types (id)
)

;


CREATE TABLE password_reset_tokens (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER NOT NULL, 
	token_hash VARCHAR(255) NOT NULL, 
	expires_at DATETIME NOT NULL, 
	used BOOL NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	UNIQUE (token_hash)
)

;


CREATE TABLE applicant_registry (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	email VARCHAR(255) NOT NULL, 
	email_hash VARCHAR(64) NOT NULL, 
	phone VARCHAR(50), 
	phone_hash VARCHAR(64), 
	name_normalized VARCHAR(255) NOT NULL, 
	address_normalized TEXT, 
	original_user_id INTEGER NOT NULL, 
	session_id INTEGER NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(session_id) REFERENCES assessment_sessions (id)
)

;


CREATE TABLE questions (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	form_id INTEGER NOT NULL, 
	behavioural_type_id INTEGER NOT NULL, 
	number INTEGER NOT NULL, 
	option_a_text TEXT NOT NULL, 
	option_b_text TEXT NOT NULL, 
	option_a_factor_id INTEGER NOT NULL, 
	option_b_factor_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_form_type_question_number UNIQUE (form_id, behavioural_type_id, number), 
	FOREIGN KEY(form_id) REFERENCES forms (id) ON DELETE CASCADE, 
	FOREIGN KEY(behavioural_type_id) REFERENCES behavioural_types (id) ON DELETE CASCADE, 
	FOREIGN KEY(option_a_factor_id) REFERENCES behavioural_factors (id) ON DELETE CASCADE, 
	FOREIGN KEY(option_b_factor_id) REFERENCES behavioural_factors (id) ON DELETE CASCADE
)

;


CREATE TABLE report_statements (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	account_type ENUM('BASIC','EXECUTIVE') NOT NULL, 
	behavioural_type_id INTEGER NOT NULL, 
	factor_id INTEGER NOT NULL, 
	score INTEGER NOT NULL, 
	score_label VARCHAR(50) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	statement_text TEXT NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_report_statement_lookup UNIQUE (account_type, behavioural_type_id, factor_id, score), 
	FOREIGN KEY(behavioural_type_id) REFERENCES behavioural_types (id), 
	FOREIGN KEY(factor_id) REFERENCES behavioural_factors (id)
)

;


CREATE TABLE section_scores (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	session_id INTEGER NOT NULL, 
	section_id INTEGER NOT NULL, 
	factor_id INTEGER NOT NULL, 
	score INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_session_section_factor UNIQUE (session_id, section_id, factor_id), 
	FOREIGN KEY(session_id) REFERENCES assessment_sessions (id), 
	FOREIGN KEY(section_id) REFERENCES behavioural_types (id), 
	FOREIGN KEY(factor_id) REFERENCES behavioural_factors (id)
)

;


CREATE TABLE session_activity_logs (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	session_id INTEGER NOT NULL, 
	action ENUM('SESSION_START','SESSION_RESUME','ANSWER_SUBMIT','ANSWER_CHANGE','SESSION_SUBMIT','PAGE_NAVIGATE') NOT NULL, 
	detail TEXT, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(session_id) REFERENCES assessment_sessions (id) ON DELETE CASCADE
)

;


CREATE TABLE duplicate_flags (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	new_session_id INTEGER NOT NULL, 
	new_user_id INTEGER NOT NULL, 
	prior_registry_id INTEGER NOT NULL, 
	prior_session_id INTEGER NOT NULL, 
	match_type ENUM('EMAIL','PHONE','NAME_ADDRESS') NOT NULL, 
	match_confidence ENUM('EXACT','FUZZY') NOT NULL, 
	status ENUM('PENDING','APPROVED','REJECTED') NOT NULL, 
	reviewed_by INTEGER, 
	reviewed_at DATETIME, 
	review_note TEXT, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(new_session_id) REFERENCES assessment_sessions (id), 
	FOREIGN KEY(prior_registry_id) REFERENCES applicant_registry (id)
)

;


CREATE TABLE responses (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	session_id INTEGER NOT NULL, 
	question_id INTEGER NOT NULL, 
	chosen_option ENUM('A','B') NOT NULL, 
	answered_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_session_question UNIQUE (session_id, question_id), 
	FOREIGN KEY(session_id) REFERENCES assessment_sessions (id), 
	FOREIGN KEY(question_id) REFERENCES questions (id)
)

;

