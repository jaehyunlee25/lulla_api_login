// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import getData from "/lib/pgConn";
import {useRouter} from "next/router";
export default async function handler(req,res){
	const router=useRouter();
	const q1="select * from "+router.query.table_name+";";
	let data=await getData(q1);
	res.status(200).json(data);
};