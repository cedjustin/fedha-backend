// importing dependencies
const express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');
var config = require('../config');
const {
    signInController,
    signUpController,
    addPostController,
    getPostsController,
    updPostController,
    delPostController,
    getPostsOnSaleController,
    getPostsOnDiscountController,
    getPostsCountController,
    getSalesPostsCountController,
    getDiscountedPostsCountController,
    getGenderController,
    getCategoryController,
    addGenderController,
    addCategoryController,
    delGenderController,
    delCategoryController,
    updCategoryController,
    updGenderController,
    updPostOnSaleController,
    updPostFromSaleController
} = require('../controller/controller');


// a function to check if token hasn't expired
router.get('/token-checker', verifyToken, (req, res) => {
    return res.json({
        error: 0,
        message: 'proceed'
    })
})


router.post('/login', [
    check('username').exists().withMessage('You must provide a username'),
    check('password').exists().withMessage('You must provide a password'),
], async (req, res) => {

    // validating data
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(JSON.stringify(errors.array()));
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        username = req.body.username
        password = req.body.password
        // when everything is okay
        await signInController(username, password)
            .then(response => {
                if (response.error == 0) {
                    jwt.sign({ user: response.data }, config.id, { expiresIn: '10h' }, (err, token) => {
                        res.json({
                            token,
                            response
                        })
                    })
                } else {
                    return res.status(200).json({ response });
                }
            }).catch(e => console.log(e));
    }
});

// signup route
router.post('/signup', [
    check('username').exists().withMessage('You must provide a username').isString().withMessage('username must be characters, ABC'),
    check('password').exists().withMessage('You must provide a password').isLength({ min: 5 }).withMessage('must be at least 5 chars long')
        .matches(/\d/).withMessage('must contain a number'),
    check('cpassword').exists().withMessage('You must provide a password').isLength({ min: 5 }).withMessage('must be at least 5 chars long')
        .matches(/\d/).withMessage('must contain a number')
], (req, res) => {
    // deformating all data
    username = req.body.username
    password = req.body.password
    cPassword = req.body.cpassword
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(JSON.stringify(errors.array()));
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else if (password != cPassword) {
        return res.status(403).json({ message: "the passwords doesn't match" });
    } else {
        signUpController(username, password).then(response => {
            if (response.error == 0) {
                jwt.sign({ user: response.data }, config.id, { expiresIn: '10h' }, (err, token) => {
                    res.json({
                        token,
                        response
                    })
                })
            } else {
                return res.status(200).json({ response });
            }
        });
    }
})

// add a new post 
router.post('/add-post', verifyToken, [
    check('categoryid').exists().withMessage('You must provide a a category id'),
    check('description').exists().withMessage('You must provide a description'),
    check('linktoimage').exists().withMessage('You must provide a linkToImage'),
    check('instock').exists().withMessage('You must provide a inStock'),
    check('amount').exists().withMessage('You must provide the amount'),
    check('genderid').exists().withMessage('You must provide the gender id'),
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(JSON.stringify(req.body));
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        let discountexp = 0;
        let onsale = 0;
        let saleexp = 0;
        let rate = 0;
        // deformating all data
        const { categoryid, description, linktoimage, instock, amount, genderid } = req.body;
        // when everything is okay
        await addPostController(categoryid, description, linktoimage, instock, discountexp, onsale, saleexp, amount, genderid, rate).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

// upd a new post 
router.put('/upd-post', verifyToken, [
    check('catid').exists().withMessage('You must provide a a category id'),
    check('datecreated').exists().withMessage('You must provide a datecreated'),
    check('description').exists().withMessage('You must provide a description'),
    check('linktoimage').exists().withMessage('You must provide a linkToImage'),
    check('instock').exists().withMessage('You must provide a inStock'),
    check('discountexp').exists().withMessage('You must provide a discountexp'),
    check('onsale').exists().withMessage('You must provide if product is on sale'),
    check('saleexp').exists().withMessage('You must provide if product is on sale'),
    check('amount').exists().withMessage('You must provide the amount'),
    check('id').exists().withMessage('You must provide the postid'),
    check('genderid').exists().withMessage('You must provide the gender id'),
    check('rate').exists().withMessage('You must provide the ratings')
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(JSON.stringify(errors));
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { catid, description, linktoimage, instock, discountexp, onsale, saleexp, amount, id, genderid, rate } = req.body;
        // when everything is okay
        await updPostController(catid, description, linktoimage, instock, discountexp, onsale, saleexp, amount, genderid, rate, id).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

// get posts 
router.delete('/del-post/:postid', verifyToken, [
    check('postid').exists().withMessage('you must provide an id')
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(req.params);
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { postid } = req.params;
        // when everything is okay
        await delPostController(postid).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

// get posts 
router.get('/get-posts', async (req, res) => {

    // deconstracting data
    const { sortby, offset, order } = req.headers;
    console.log(req.headers);

    // when everything is okay
    await getPostsController(offset, order, sortby).then(response => {
        return res.json({ response })
    })
});

// get posts which are on sale
router.get('/get-posts-on-sale', async (req, res) => {

    // deconstracting data
    const { sortby, offset, order } = req.headers;

    // when everything is okay
    await getPostsOnSaleController(offset, order, sortby).then(response => {
        return res.json({ response })
    })
});

// get posts which are on sale
router.get('/get-posts-on-discount', async (req, res) => {

    // deconstracting data
    const { sortby, offset, order } = req.headers;

    // when everything is okay
    await getPostsOnDiscountController(offset, order, sortby).then(response => {
        return res.json({ response })
    })
});

// get all products count
router.get('/all-posts-count', async (req, res) => {
    // when everything is okay
    await getPostsCountController().then(response => {
        return res.json({ response })
    })
})

// get all sales products count
router.get('/sales-posts-count', async (req, res) => {
    // when everything is okay
    await getSalesPostsCountController().then(response => {
        return res.json({ response })
    })
})

// get all sales products count
router.get('/discounted-posts-count', async (req, res) => {
    // when everything is okay
    await getDiscountedPostsCountController().then(response => {
        return res.json({ response })
    })
})

// get all gender
router.get('/get-gender', async (req, res) => {
    // when everything is okay
    await getGenderController().then(response => {
        return res.json({ response })
    })
})

// get all category
router.get('/get-category', async (req, res) => {
    // when everything is okay
    await getCategoryController().then(response => {
        return res.json({ response })
    })
})

// add a new gender 
router.post('/add-gender', verifyToken, [
    check('name').exists().withMessage('You must provide a gender')
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(JSON.stringify(req.body));
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { name } = req.body;
        // when everything is okay
        await addGenderController(name).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

// add a new category 
router.post('/add-category', verifyToken, [
    check('name').exists().withMessage('You must provide a category')
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { name } = req.body;
        // when everything is okay
        await addCategoryController(name).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});


// put on sale
router.put('/upd-put-on-sale', verifyToken, [
    check('postid').exists().withMessage('You must provide a postid'),
    check('days').exists().withMessage('You must provide a days')
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { postid, days } = req.body;
        // when everything is okay
        await updPostOnSaleController(postid, days).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

// put on sale
router.put('/upd-rm-on-sale', verifyToken, [
    check('postid').exists().withMessage('You must provide a postid'),
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { postid, days } = req.body;
        // when everything is okay
        await updPostFromSaleController(postid).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

// delete a gender 
router.delete('/del-gender/:id', verifyToken, [
    check('id').exists().withMessage('You must provide an id')
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { id } = req.params;
        // when everything is okay
        await delGenderController(id).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});


// delete a category 
router.delete('/del-category/:id', verifyToken, [
    check('id').exists().withMessage('You must provide an id')
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { id } = req.params;
        // when everything is okay
        await delCategoryController(id).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});


// update a gender 
router.put('/upd-gender', verifyToken, [
    check('id').exists().withMessage('You must provide an id'),
    check('name').exists().withMessage('You must provide a name')
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { id, name } = req.body;
        // when everything is okay
        await updGenderController(id, name).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});


// update a category 
router.put('/upd-category', verifyToken, [
    check('id').exists().withMessage('You must provide an id'),
    check('name').exists().withMessage('You must provide a name')
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { id, name } = req.body;
        // when everything is okay
        await updCategoryController(id, name).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});


// verify token
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    // check if bearer is undefined
    if (typeof bearerHeader !== undefined) {
        //split at the space
        const bearer = bearerHeader.split(' ');
        // get token from array
        const token = bearer[1];
        jwt.verify(token, config.id, (err, authData) => {
            if (err) {
                res.json({
                    error: 1,
                    status: 403,
                    message: 'you are lost'
                })
            } else {
                next();
            }
        })
    } else {
        res.json({
            error: 1,
            status: 403,
            message: 'you are lost'
        })
    }
}

module.exports = router;