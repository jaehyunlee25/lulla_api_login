// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import getData from "/lib/pgConn";
import {useRouter} from "next/router";
export default async function Handler(req,res){
	//const router=useRouter();
	//console.log(router);
	console.log(req.query.name);
	const q1="select * from "+req.query.name+";";
	let data=await getData(q1);
	res.status(200).json(data);
};