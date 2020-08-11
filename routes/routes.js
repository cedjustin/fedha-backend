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
    addGenderController,
    addColorController,
    addCategoryController,
    addProductTypeController,
    getShopInfoController,
    addBlogContentController,
    getBlogContentController,
    getPostsByConditionController,
    getPostsController,
    getPostsOnSaleController,
    getPostsOnDiscountController,
    getPostsCountController,
    getSalesPostsCountController,
    getDiscountedPostsCountController,
    getGenderController,
    getCategoryController,
    getColorsController,
    getCarouselController,
    getProducttypeController,
    updProductTypeController,
    updBlogContentController,
    updCategoryController,
    updGenderController,
    updPostOnSaleController,
    updPostFromSaleController,
    updPostController,
    updColorController,
    updCarouselController,
    updShopInfoController,
    delBlogContentController,
    delPostController,
    delGenderController,
    delCategoryController,
    delProducttypeController,
    sendEmailController,
    searchController
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
    check('description').exists().withMessage('You must provide a description'),
    check('linktoimage').exists().withMessage('You must provide a linkToImage'),
    check('amount').exists().withMessage('You must provide the amount'),
    check('name').exists().withMessage('You must provide the product name'),
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { description, linktoimage, amount, name} = req.body;
        // const newlinktoimage = linktoimage.replace('dl=0', 'raw=1');
        // 
        // when everything is okay
        await addPostController(newlinktoimage, description, amount, name).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

// upd a new post 
router.put('/upd-post', verifyToken, [
    check('datecreated').exists().withMessage('You must provide a datecreated'),
    check('description').exists().withMessage('You must provide a description'),
    check('linktoimage').exists().withMessage('You must provide a linkToImage'),
    check('amount').exists().withMessage('You must provide the amount'),
    check('id').exists().withMessage('You must provide the postid'),
    check('name').exists().withMessage('You must provide the product name'),
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(JSON.stringify(errors));
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { description, linktoimage,amount, id, name} = req.body;
        const newlinktoimage = linktoimage.replace('dl=0', 'raw=1');
        // when everything is okay
        await updPostController(description, newlinktoimage, amount, name, id ).then(response => {
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

    // when everything is okay
    await getPostsController(offset, order, sortby).then(response => {
        return res.json({ response })
    })
});

// get shop info 
router.get('/get-shop-info', async (req, res) => {

    // when everything is okay
    await getShopInfoController().then(response => {
        return res.json({ response })
    })
});

// get posts 
router.get('/get-posts-by-condition', async (req, res) => {

    // deconstracting data
    const { condition, value, offset } = req.headers;

    // when everything is okay
    await getPostsByConditionController(condition, value, offset).then(response => {
        return res.json({ response })
    });
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

// get all types
router.get('/get-types', async (req, res) => {
    // when everything is okay
    await getProducttypeController().then(response => {
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

// get all colors
router.get('/get-colors', async (req, res) => {
    // when everything is okay
    await getColorsController().then(response => {
        return res.json({ response })
    })
})

// get all carousel data
router.get('/get-carousel', async (req, res) => {
    // when everything is okay
    await getCarouselController().then(response => {
        return res.json({ response })
    })
})


// get all blog data
router.get('/get-blog-content', async (req, res) => {

    const { offset } = req.headers;

    // when everything is okay
    await getBlogContentController(offset).then(response => {
        return res.json({ response })
    })
})

// add a new color 
router.post('/add-color', verifyToken, [
    check('name').exists().withMessage('You must provide a color name'),
    check('code').exists().withMessage('You must provide a color code'),
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(JSON.stringify(req.body));
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { name, code } = req.body;
        newColorCode = '#' + code;
        // when everything is okay
        await addColorController(name, newColorCode).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

// add a new type 
router.post('/add-type', verifyToken, [
    check('name').exists().withMessage('You must provide a type name'),
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
        await addProductTypeController(name).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

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

// add a new blog content 
router.post('/add-blog-content', verifyToken, [
    check('title').exists().withMessage('You must provide a title'),
    check('content').exists().withMessage('You must provide the content'),
    check('linktoimage').exists().withMessage('You must provide linktoimage'),
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { title, content, linktoimage } = req.body;
        newlinktoimage = linktoimage.replace('dl=0', 'raw=1');
        // when everything is okay
        await addBlogContentController(title, content, newlinktoimage).then(response => {
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

// update product type
router.put('/upd-product-type', verifyToken, [
    check('id').exists().withMessage('You must provide a type id'),
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
        await updProductTypeController(id, name).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

// put on sale
router.put('/upd-shop-info', verifyToken, [
    check('id').exists().withMessage('You must provide a id'),
    check('location').exists().withMessage('You must provide a location'),
    check('phone').exists().withMessage('You must provide a phone'),
    check('email').exists().withMessage('You must provide an email'),
    check('about').exists().withMessage('You must provide an about')
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { id, location, phone, email, about } = req.body;
        // when everything is okay
        await updShopInfoController(id, location, phone, email, about).then(response => {
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

// delete a producttype 
router.delete('/del-type/:id', verifyToken, [
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
        await delProducttypeController(id).then(response => {
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

// delete a blog content 
router.delete('/del-blog-content/:id', verifyToken, [
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
        await delBlogContentController(id).then(response => {
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

// update a color 
router.put('/upd-color', verifyToken, [
    check('id').exists().withMessage('You must provide an id'),
    check('name').exists().withMessage('You must provide a name'),
    check('colorcode').exists().withMessage('You must provide a colorcode'),
], async (req, res) => {
    console.log('hey');
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { id, name, colorcode } = req.body;
        // when everything is okay
        await updColorController(id, name, colorcode).then(response => {
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

// update a blog content 
router.put('/upd-blog-content', verifyToken, [
    check('id').exists().withMessage('You must provide an id'),
    check('linktoimage').exists().withMessage('You must provide a link to image'),
    check('content').exists().withMessage('You must provide the content'),
    check('comments').exists().withMessage('You must provide the comments'),
    check('title').exists().withMessage('You must provide the title'),
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { id, linktoimage, content, comments, title } = req.body;
        const newlinktoimage = linktoimage.replace('dl=0', 'raw=1');
        // when everything is okay
        await updBlogContentController(id, newlinktoimage, content, comments, title).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

// update a carousel 
router.put('/upd-carousel', verifyToken, [
    check('id').exists().withMessage('You must provide an id'),
    check('name').exists().withMessage('You must provide a title'),
    check('linktoimage').exists().withMessage('You must provide a link to image'),
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { id, name, linktoimage } = req.body;
        const newlinktoimage = linktoimage.replace('dl=0', 'raw=1');
        // when everything is okay
        await updCarouselController(newlinktoimage, name, id).then(response => {
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

// an api to send emails
router.post('/send-email', [
    check('email').exists().withMessage('You must provide an email'),
    check('message').exists().withMessage('You must provide a message'),
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { email, message } = req.body;
        // when everything is okay
        await sendEmailController(email, message).then(response => {
            console.log(response);
            return res.json({ response });
        }).then(e => {
            console.log(e);
        })
    }
});

// an api to handle searches
router.post('/search', [
    check('value').exists().withMessage('You must provide the value to be searched'),
], async (req, res) => {
    // validating data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ error: 1, message: 'check your inputs and make sure they exists and they are correct' });
    } else {
        // deformating all data
        const { value } = req.body;
        // when everything is okay
        await searchController(value).then(response => {
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