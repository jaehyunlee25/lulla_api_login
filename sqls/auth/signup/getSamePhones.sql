select 
	*
from
	users
where
	phone='${phone}'
	and activated=true;