insert into
	users (
		id,
		password,
		email,
		phone,
		activated,
		name,
		provider,
		created_at,
		updated_at,
		device_token,
		token_type,
		advertise,
		last_login
	)
values (
	uuid_generate_v1(),	-- id default uuid_generate_v1()
	'${password}',
	'${email}',
	'${phone}',
	true,	-- activated default false
	'${name}',
	'${provider}',	-- local, kakao, google, naver, apple
	now(),	-- created_at
	now(),	-- updated_at
	'',		-- device_token
	null,		-- token_type 0 안드로이드, 1 애플
	false,		-- advertise default false
	null		-- last_login
)
returning id;