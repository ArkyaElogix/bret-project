-- Data backup for database `testdb`
-- Created at 2026-07-21T13:11:55
SET FOREIGN_KEY_CHECKS=0;

-- `assessment_sessions`: 4 rows
INSERT INTO `assessment_sessions` (`id`, `user_id`, `form_id`, `product_type`, `status`, `created_at`, `updated_at`, `submitted_at`) VALUES (2, 2, 1, 'BASIC', 'submitted', '2026-07-13 06:24:15', '2026-07-13 06:32:09', '2026-07-13 06:32:09');
INSERT INTO `assessment_sessions` (`id`, `user_id`, `form_id`, `product_type`, `status`, `created_at`, `updated_at`, `submitted_at`) VALUES (4, 2, 11, 'BASIC', 'submitted', '2026-07-17 05:35:28', '2026-07-17 09:17:54', '2026-07-17 09:17:54');
INSERT INTO `assessment_sessions` (`id`, `user_id`, `form_id`, `product_type`, `status`, `created_at`, `updated_at`, `submitted_at`) VALUES (5, 4, 11, 'BASIC', 'submitted', '2026-07-20 07:23:49', '2026-07-20 07:30:07', '2026-07-20 07:30:07');
INSERT INTO `assessment_sessions` (`id`, `user_id`, `form_id`, `product_type`, `status`, `created_at`, `updated_at`, `submitted_at`) VALUES (6, 4, 11, 'BASIC', 'submitted', '2026-07-20 08:37:15', '2026-07-20 08:37:57', '2026-07-20 08:37:57');

-- `behavioural_factors`: 17 rows
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (1, 1, 'Altruistic', 1);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (2, 1, 'Emotional', 2);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (3, 1, 'Power', 3);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (4, 1, 'Existential', 4);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (5, 14, 'Altruistic', 1);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (6, 14, 'Emotional', 2);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (7, 14, 'Power', 3);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (8, 14, 'Existential', 4);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (9, 15, 'Type I', 1);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (10, 15, 'Type II', 2);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (11, 15, 'Type III', 3);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (12, 15, 'Type IV', 4);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (13, 16, 'Type I', 1);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (14, 16, 'Type II', 2);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (15, 16, 'Type III', 3);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (16, 16, 'Type IV', 4);
INSERT INTO `behavioural_factors` (`id`, `behavioural_type_id`, `name`, `order_index`) VALUES (21, 36, 'ggggg', 1);

-- `behavioural_types`: 15 rows
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (1, 'A', 'Section A', 'Choose the option that best descibes you', 1, 1);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (2, 'B', 'Section B', 'Choose the option that best explains you', 2, 1);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (3, 'C', 'Section C', 'Choose the most fitting option', 3, 1);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (14, 'E', 'Subsection A', 'Please choose the statement that you find most appropriate. In case you find both true of you choose the statement that connects with you most strongly. In case you feel neither is true of you, choose the one which is more likely to be true of you.', 0, 11);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (15, 'F', 'Subsection B', 'On the following pages are several pairs of statements describing possible behavioral responses. For each pair, please choose one statement that is most likely to be true of you.

In many cases, neither the “A” nor the “B” statement may be very typical of your behaviors, but please select the response which you would be most likely to use', 1, 11);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (16, 'G', 'Subsection C', 'On the following pages are several pairs of statements describing possible behavioral responses. For each pair, please choose one statement that is most likely to be true of you.', 2, 11);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (26, 'A', 'Subsection A', NULL, 0, 15);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (27, 'B', 'Subsection B', NULL, 1, 15);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (28, 'C', 'Subsection C', NULL, 2, 15);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (32, 'A', 'Subsection A', NULL, 0, 17);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (33, 'B', 'Subsection B', NULL, 1, 17);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (34, 'C', 'Subsection C', NULL, 2, 17);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (35, 'A', 'Subsection A', NULL, 0, 18);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (36, 'B', 'Subsection B', NULL, 1, 18);
INSERT INTO `behavioural_types` (`id`, `code`, `name`, `instructions`, `order_index`, `form_id`) VALUES (37, 'C', 'Subsection C', NULL, 2, 18);

-- `forms`: 5 rows
INSERT INTO `forms` (`id`, `name`, `is_active`, `created_at`) VALUES (1, 'BRETv1', 1, '2026-07-10 09:37:26');
INSERT INTO `forms` (`id`, `name`, `is_active`, `created_at`) VALUES (11, 'BRETv1_test', 1, '2026-07-16 10:31:33');
INSERT INTO `forms` (`id`, `name`, `is_active`, `created_at`) VALUES (15, 'BRET 3', 0, '2026-07-20 11:23:46');
INSERT INTO `forms` (`id`, `name`, `is_active`, `created_at`) VALUES (17, 'sdgdf', 0, '2026-07-20 12:05:32');
INSERT INTO `forms` (`id`, `name`, `is_active`, `created_at`) VALUES (18, 'BRET v3', 0, '2026-07-20 12:08:15');

-- `questions`: 30 rows
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (7, 11, 14, 1, 'My objective is to ensure financial security of my family', 'I would like to leave all my wealth to charity when I die', 6, 5);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (8, 11, 14, 2, 'The only way to measure success is to see how powerful is a person', 'I live for the moment', 7, 8);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (9, 11, 14, 3, 'I feel overwhelmed when I see the sufferings of others', 'What matters most is the happiness of my family and friends', 5, 6);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (10, 11, 14, 4, 'Alexander the Great is my favourite historical character', '"Bread, wine and thou” is all that I need for a happy life.', 7, 8);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (11, 11, 14, 5, 'I believe it’s more important to be a good human being than a successful one', 'Everyone needs an emotional support system', 5, 6);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (12, 11, 14, 6, 'As long as you have money, you can do and have anything', 'Being a king has to many problems. I only want to live like one', 7, 8);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (13, 11, 14, 7, 'To serve mankind is the ultimate good deed', 'I want to ensure that I have enough money in the bank when I retire', 6, 8);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (14, 11, 14, 8, 'I will stand by my friends even if they are in the wrong. That’s loyalty', 'I do not like realism in art or movies', 5, 7);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (15, 11, 14, 9, 'Governments should spend more on removing poverty than business growth', 'I do not want to pay taxes so that some one else can get free health facility', 5, 7);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (16, 11, 14, 10, 'Taxes on luxury goods should be reduced', 'I would love to go to the border and defend my country.', 8, 6);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (17, 11, 15, 1, 'I find routine tasks and activities boring', 'I like everything to be in order and well arranged', 9, 12);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (18, 11, 15, 2, 'If there is no defined way of executing a task, I am usually able to find a way of doing it effectively', 'When I go to a new place, I want my usual food and drinks to be available.', 9, 12);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (19, 11, 15, 3, 'I like finding out new ways of doing things.', 'I have difficulties every time I have to change my mobile phone', 9, 12);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (20, 11, 15, 4, 'When I buy something new, I want to check all the details about it', 'I like to hear about new things from my friends', 11, 10);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (21, 11, 15, 5, 'Travelling is never easy for me. I can’t sleep if it’s not my own bed.', 'When I buy something, I check all the details about the product and the conditions of purchase Dinosaurs died because they could not change themselves', 12, 11);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (22, 11, 15, 6, 'I need to talk to people and find out about new things', 'I can not succeed unless I am willing to take risks', 10, 9);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (23, 11, 15, 7, 'Not sudden but continuous improvement is what brings success', 'I would like to watch others experiment and then try their ways only if they succeed.', 10, 11);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (24, 11, 15, 8, 'I like finding out about new developments in my field of work', 'I would like to analyse chances of success or failure in detail before any decision', 10, 11);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (25, 11, 15, 9, 'It does not matter what others may say, I would like to evaluate the chances of success on my own', 'One successful idea is worth a hundred failure', 11, 9);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (26, 11, 15, 10, 'I enjoy watching old TV serials and movies', 'We should gradually replace all old things and practices', 12, 10);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (27, 11, 16, 1, 'I like to work in a systematic manner', 'To be successful as a team, everyone should agree to what has to be done', 14, 15);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (28, 11, 16, 2, 'If I am asked to do a job, I should be allowed to decide how to do it', 'Nobody in the team should be unhappy', 13, 16);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (29, 11, 16, 3, 'You cannot pay attention to every opinion if you want to achieve anything', 'I make sure that everyone in my team understands the rules and follows them', 13, 14);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (30, 11, 16, 4, 'People should have good relationships in a team', 'I always try and follow what my team members may want even if I am their leader', 15, 16);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (31, 11, 16, 5, 'People should follow whatever their leader may ask them to do', 'My success or failure depends on my team', 13, 16);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (32, 11, 16, 6, 'My professional work group is like a family to me', 'The relationship in the work place should be absolutely professional.', 15, 14);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (33, 11, 16, 7, 'Being democratic can lead to chaos', 'People should follow the rules and processes', 13, 14);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (34, 11, 16, 8, 'I am worried about the sentiments of the people I work with', 'If people feel good, they are going to work well', 16, 15);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (35, 11, 16, 9, 'I trust my own judgement, what others say is not important', 'After a meeting I like to send an email to record our discussions', 13, 14);
INSERT INTO `questions` (`id`, `form_id`, `behavioural_type_id`, `number`, `option_a_text`, `option_b_text`, `option_a_factor_id`, `option_b_factor_id`) VALUES (36, 11, 16, 10, 'My growth in the organization has largely been thanks to my team', 'I can understand the emotions of people around me without asking them', 16, 15);

-- `responses`: 0 rows

-- `section_scores`: 36 rows
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (1, 2, 1, 1, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (2, 4, 14, 6, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (3, 4, 14, 8, 4);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (4, 4, 14, 5, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (5, 4, 15, 12, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (6, 4, 15, 9, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (7, 4, 15, 10, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (8, 4, 15, 11, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (9, 4, 16, 14, 4);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (10, 4, 16, 16, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (11, 4, 16, 15, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (12, 4, 16, 13, 1);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (13, 5, 14, 6, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (14, 5, 14, 7, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (15, 5, 14, 5, 4);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (16, 5, 14, 8, 1);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (17, 5, 15, 9, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (18, 5, 15, 11, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (19, 5, 15, 12, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (20, 5, 15, 10, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (21, 5, 16, 14, 1);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (22, 5, 16, 13, 5);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (23, 5, 16, 15, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (24, 5, 16, 16, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (25, 6, 14, 5, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (26, 6, 14, 8, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (27, 6, 14, 7, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (28, 6, 14, 6, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (29, 6, 15, 9, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (30, 6, 15, 12, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (31, 6, 15, 10, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (32, 6, 15, 11, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (33, 6, 16, 15, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (34, 6, 16, 16, 3);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (35, 6, 16, 13, 2);
INSERT INTO `section_scores` (`id`, `session_id`, `section_id`, `factor_id`, `score`) VALUES (36, 6, 16, 14, 2);

-- `users`: 3 rows
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `created_at`, `updated_at`) VALUES (1, 'Admin User', 'admin@test.com', '$2b$12$tpmGObZic06gWfNfYHTqCO3SuJr2ZL.h1VdKRLOYbydy25MiV0hKG', 'ADMIN', '2026-07-10 16:25:58', '2026-07-10 16:26:01');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `created_at`, `updated_at`) VALUES (2, 'Test Candidate', 'candidate@test.com', '$2b$12$O4K7nHTAXmNBdC.VWQh.5uyZkFvW5ywGPvdfaefr2LmL5iCARynRi', 'USER', '2026-07-10 16:27:13', '2026-07-10 16:27:14');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `created_at`, `updated_at`) VALUES (4, 'Arkya', 'arkya@test.com', '$2b$12$mhsDZg1qFOrW.eldjFCLvuo9hp0RUlE/Z86G4j8P2RRcR2b10Hojy', 'USER', '2026-07-20 07:01:17', '2026-07-20 07:01:17');

SET FOREIGN_KEY_CHECKS=1;
