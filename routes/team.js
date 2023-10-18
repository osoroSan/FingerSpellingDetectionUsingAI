const express = require('express')
const router= express.Router()
router.get('/',(req,res)=>{
res.render('team/index')
})

module.exports=router