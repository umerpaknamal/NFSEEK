import { Router, useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Loading } from "../../src/helper/helper";
import { common } from "../../src/helper/Common";
import Link from 'next/link';

const SuccessPage = () => {
    const router = useRouter();
    const [orderstatus, setORderstatus] = useState('');

    const store = useSelector(store => store);
    const {session_id, plan_id, couponCode} = router.query;
    
    useEffect(() => {
        if(session_id && plan_id){
            handleSuccess(session_id, plan_id, couponCode)
        }
    }, [session_id])

    
    const handleSuccess = (session_id, plan_id, couponCode) =>{
        const data = {
            session_id : session_id,
            user_id : store.userData.user_id,
            plan_id : plan_id
        }
        if(couponCode !== ''){
            data.couponCode = couponCode
        }
        Loading(true);
        common.getAPI({
            method: 'POST',
            url: 'user/stripeSuccess',
            data: data
        }, (resp) => {
            if (resp.status === "success") {
                setORderstatus(resp)
            }
        })
    }

    return (
        <>
          <div className="pu_noData">
              <h1>Your Payment is Successfull. </h1>
              <button className="pu_btn"><Link href={'/dashboard'}>Back to home</Link></button>
          </div>
        </>
    )
}

export default SuccessPage;
