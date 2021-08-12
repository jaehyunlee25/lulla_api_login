select 
	*
from 
	verify_numbers
where
	phone='${phone}'
	and is_verify=true
	and type=0;