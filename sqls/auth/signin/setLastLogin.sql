update
	users
set
	last_login='${today}'
where
	id='${id}';
