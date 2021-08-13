insert into
	verify_numbers(
		id,
		phone,
		code,
		is_verify,
		type,
		created_at,
		updated_at
	)
values(
	uuid_generate_v1(),	-- id uuid,
	'${phone}',	-- phone string,
	'${code}',	-- code string,
	false,	-- is_verify bool,
	${type},	-- type int,
	now(),	-- created_at timestamp,
	now()	-- updated_at timestamp
)
returning id;