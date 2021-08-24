select 
	*
from
	users
where
	email='${email}',
	and provider='${type}';