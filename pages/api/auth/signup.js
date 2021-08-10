import getData from "/lib/pgConn";
export default async function handler(req,res){
	const q1="select * from member;";
	let data=await getData(q1);
	res.status(200).json(data);
};