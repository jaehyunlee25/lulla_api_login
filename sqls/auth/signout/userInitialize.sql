update
	users
set
	provider=null,
	activated=false,
	email=null,
	phone=null,
	name=null
where
	id='${id}';
