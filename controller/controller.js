// importing dependencies
const { Client } = require('pg');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const moment = require('moment');



// configuring the db
const client = new Client({
    connectionString: process.env.Database_url,
    ssl: true,
});




// connecting to the database
client.connect().then(() => console.log('db connected')).catch(e => console.log(e));

// start of controllers

let _getTimeStamp = async () => {
    return moment().format();
}

// function for checking if the user exists and SignIn
module.exports.signInController = async (username, password) => {
    username = username.toLowerCase().trim();
    password = password.trim();
    let response;
    query = 'SELECT COUNT(1) FROM users WHERE username=$1';
    values = [username];
    await client.query(query, values).then(async res => {
        if (res.rows[0].count == 1) {
            getUserQuery = 'SELECT id,username,password FROM users WHERE username=$1';
            getUserValues = [username]
            await client.query(getUserQuery, getUserValues).then(async res => {
                if (res.rows.length <= 0) {
                    response = {
                        error: 1,
                        message: 'there are no users'
                    }
                } else {
                    const hashedpassword = res.rows[0].password
                    const passwordMatch = bcrypt.compareSync(password, hashedpassword);
                    if (passwordMatch) {
                        response = {
                            error: 0,
                            message: 'proceed',
                            data: {
                                id: res.rows[0].id,
                                username: res.rows[0].username
                            }
                        }
                    } else {
                        response = {
                            error: 1,
                            message: "Username or password is incorrect",
                            username: username
                        };
                    }
                }
            }).catch(e => {
                response = {
                    error: 1,
                    message: '404'
                }
            });
        } else {
            response = {
                error: 1,
                message: "Username or password is incorrect",
                username: username
            };
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "404"
        };
        console.log(e);
    });
    return response
}

// a function to add a new user
module.exports.signUpController = async (username, password) => {
    username = username.toLowerCase().trim();
    password = password.trim()
    let response;
    query = 'SELECT COUNT(1) FROM users WHERE username=$1';
    values = [username];
    await client.query(query, values).then(async res => {
        if (res.rows[0].count == 1) {
            response = {
                error: 1,
                message: 'Username already in use'
            };
        } else {
            var hash = bcrypt.hashSync(password, saltRounds);
            let insertQuery = {
                text: 'INSERT INTO users(username,password) VALUES ($1,$2) RETURNING *',
                values: [username, hash]
            }
            await client.query(insertQuery).then(async res => {
                response = {
                    error: 0,
                    message: 'Proceed',
                    data: {
                        id: res.rows[0].id,
                        username: res.rows[0].username
                    }
                }
            }).catch(e => {
                console.log(e);
                response = {
                    error: 1,
                    message: "404"
                };
            })
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "404"
        };
        console.log(e);
    });
    return response
}

const checkIfPostExists = async (categoryid, description, amount) => {
    let response
    query = 'SELECT COUNT(1) FROM posts WHERE catid=$1 AND description=$2 AND amount=$3';
    values = [categoryid, description, amount];
    await client.query(query, values).then(async res => {
        if (res.rows[0].count == 1) {
            response = true
        } else {
            response = false
        }
    }).catch(e => {
        console.log(e);
    })
    return response;
}

// function to add a post or product
module.exports.addPostController = async (categoryid, description, linkToImage, inStock, discountexp, onsale, saleexp, amount, genderId, name, sizes) => {
    getTimeStamp = await _getTimeStamp();
    categoryid = categoryid;
    description = description.trim();
    genderId = genderId.trim();
    producttype = sizes.productType;
    let response;
    let postExists = await checkIfPostExists(categoryid, description, amount);
    if (postExists) {
        response = {
            error: 1,
            message: 'post arleady exist'
        }
    } else {
        let insertQuery = {
            text: 'INSERT INTO posts(catid,datecreated,description,linktoimage,instock,discountexp,onsale,saleexp,amount,genderid,name,sizes,producttype) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
            values: [categoryid, getTimeStamp, description, linkToImage, inStock, discountexp, onsale, saleexp, amount, genderId, name, sizes, producttype]
        }
        await client.query(insertQuery).then(async res => {
            response = {
                error: 0,
                message: 'Proceed',
                data: res.rows
            }
        }).catch(e => {
            console.log(e)
            response = {
                error: 1,
                message: "404"
            };
        })
    }
    return response;
}


// function to add blog content
module.exports.addBlogContentController = async (title, content, linktoimage) => {
    getTimeStamp = await _getTimeStamp();
    title = title.trim();
    content = content.trim();
    linktoimage = linktoimage.trim();
    comments = '[]';
    let response;
    let insertQuery = {
        text: 'INSERT INTO blog(title,linktoimage,content,datecreated,comments) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        values: [title, linktoimage, content, getTimeStamp, comments]
    }
    await client.query(insertQuery).then(async res => {
        response = {
            error: 0,
            message: 'blog content added',
            data: res.rows
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    })
    return response;
}


// function to put post on sale
module.exports.updPostOnSaleController = async (postid, days) => {
    const saleexp = moment().add(days, 'days');
    let response;
    const updatePostQuery = {
        text: 'UPDATE posts SET onsale=$2,saleexp=$3 WHERE id=$1',
        values: [postid, '1', saleexp]
    }
    await client.query(updatePostQuery).then(async res => {
        response = {
            error: 0,
            message: 'post putted on sale'
        };
    }).catch(e => {
        console.log(e);
        response = {
            error: 1,
            message: "404"
        };
    })
    return response;
}

// function to remove post on sale
module.exports.updPostFromSaleController = async (postid) => {
    let response;
    const updatePostQuery = {
        text: 'UPDATE posts SET onsale=$2,saleexp=$3 WHERE id=$1',
        values: [postid, '0', '0']
    }
    await client.query(updatePostQuery).then(async res => {
        response = {
            error: 0,
            message: 'post removed on sale'
        };
    }).catch(e => {
        console.log(e);
        response = {
            error: 1,
            message: "404"
        };
    })
    return response;
}

// function to update all budgets
module.exports.updPostController = async (categoryid, description, linkToImage, inStock, discountexp, onsale, saleexp, amount, genderId, name, postId, sizes) => {
    description = description.trim();
    linkToImage = linkToImage.replace('dl=0', 'raw=1');
    productType = sizes.productType;
    let response;
    let updatePostQuery = {
        text: 'UPDATE posts SET catid=$1,description=$2,linktoimage=$3,instock=$4,discountexp=$5,onsale=$6,saleexp=$7,amount=$8,name=$9,genderid=$10,sizes=$11,producttype=$12 WHERE id=$13',
        values: [categoryid, description, linkToImage, inStock, discountexp, onsale, saleexp, amount, name, genderId, sizes, productType, postId]
    }
    await client.query(updatePostQuery).then(async res => {
        response = {
            error: 0,
            message: 'post updated'
        };
    }).catch(e => {
        console.log(e);
        response = {
            error: 1,
            message: "404"
        };
    })
    return response;
}

// delete post
module.exports.delPostController = async (postId) => {
    postId = postId.trim();
    let response;
    let text = 'DELETE FROM posts WHERE id=$1';
    values = [postId];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: "posts deleted"
        };
    }).catch(e => {
        response = {
            error: 1,
            message: "post not deleted "
        }
        console.log(e);
    })
    return response;
}

// function to get all budgets
module.exports.getPostsController = async (offset, order, sortby) => {
    let response;
    getPostsQuery = {
        text: 'SELECT id,catid,datecreated,description,linktoimage,instock,discountexp,onsale,saleexp,amount,name, genderid,sizes,producttype FROM posts ORDER BY ' + sortby + ' ' + order + ' OFFSET $1 FETCH FIRST 10 ROWS ONLY',
        values: [offset]
    }
    await client.query(getPostsQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no posts'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' posts',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}


// function to get shop info
module.exports.getShopInfoController = async () => {
    let response;
    getPostsQuery = {
        text: 'SELECT id,about,email,phone,location FROM shopinfo',
    }
    await client.query(getPostsQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no shop info'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' posts',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}


// function to get all budgets
module.exports.getBlogContentController = async (offset) => {
    let response;
    getPostsQuery = {
        text: 'SELECT id,title,datecreated,content,linktoimage,comments FROM blog ORDER BY id DESC OFFSET $1 FETCH FIRST 3 ROWS ONLY',
        values: [offset]
    }
    await client.query(getPostsQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no posts'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' posts',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}

// function to get all budgets
module.exports.getPostsByConditionController = async (condition, value, offset) => {
    let response;
    getPostsQuery = {
        text: 'SELECT id,catid,datecreated,description,linktoimage,instock,discountexp,onsale,saleexp,amount,name, genderid,sizes,producttype FROM posts WHERE ' + condition + '=$1 ORDER BY id DESC OFFSET $2 FETCH FIRST 10 ROWS ONLY',
        values: [value, offset]
    }
    await client.query(getPostsQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no posts'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' posts',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}


//a function to get posts which are only on sales
module.exports.getPostsOnSaleController = async (offset, order, sortby) => {
    let response;
    getPostsQuery = {
        text: 'SELECT id,catid,datecreated,description,linktoimage,instock,discountexp,onsale,saleexp,amount,name FROM posts WHERE onsale = $1 ORDER BY ' + sortby + ' ' + order + ' OFFSET $2 FETCH FIRST 10 ROWS ONLY',
        values: ['1', offset]
    }
    await client.query(getPostsQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no posts on sale'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' posts',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}

//a function to get posts which are only on sales
module.exports.getPostsOnDiscountController = async (offset, order, sortby) => {
    let response;
    getPostsQuery = {
        text: 'SELECT id,catid,datecreated,description,linktoimage,instock,discountexp,onsale,saleexp,amount,name,genderid FROM posts WHERE discountexp != $1 ORDER BY ' + sortby + ' ' + order + ' OFFSET $2 FETCH FIRST 10 ROWS ONLY',
        values: ['0', offset]
    }
    await client.query(getPostsQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no posts on discount'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.count + ' posts',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}


//a function to get the count of all posts
module.exports.getPostsCountController = async () => {
    let response;
    getPostsQuery = {
        text: 'SELECT COUNT(1) FROM posts'
    }
    await client.query(getPostsQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no posts'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.count + ' posts',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}


//a function to get the count of all sales posts
module.exports.getSalesPostsCountController = async () => {
    let response;
    getPostsQuery = {
        text: 'SELECT COUNT(1) FROM posts WHERE onsale = $1',
        values: ['1']
    }
    await client.query(getPostsQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no posts on sales'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' posts',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}

//a function to get the count of all discounted posts
module.exports.getDiscountedPostsCountController = async () => {
    let response;
    getPostsQuery = {
        text: 'SELECT COUNT(1) FROM posts WHERE discountexp != $1',
        values: ['0']
    }
    await client.query(getPostsQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no discounted posts'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' posts',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}


//a function to get gender 
module.exports.getGenderController = async () => {
    let response;
    getGenderQuery = {
        text: 'SELECT id,name from gender'
    }
    await client.query(getGenderQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no gender in db'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' genders',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}

//a function to get colors 
module.exports.getColorsController = async () => {
    let response;
    getGenderQuery = {
        text: 'SELECT id,name,colorcode from colors'
    }
    await client.query(getGenderQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no colors in db'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' colors',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}

//a function to get gender 
module.exports.getCategoryController = async () => {
    let response;
    getGenderQuery = {
        text: 'SELECT id,name from categories'
    }
    await client.query(getGenderQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no categories in db'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' categories',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}

//a function to get gender 
module.exports.getProducttypeController = async () => {
    let response;
    getGenderQuery = {
        text: 'SELECT id,name from producttype'
    }
    await client.query(getGenderQuery).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no types in db'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' types',
                data: res.rows
            }
        }
    }).catch(e => {
        console.log(e)
        response = {
            error: 1,
            message: "404"
        };
    });
    return response;
}

// a function to add gender
module.exports.addGenderController = async (name) => {
    name = name.trim();
    let response
    query = 'SELECT COUNT(1) FROM gender WHERE name=$1';
    values = [name];
    await client.query(query, values).then(async res => {
        if (res.rows[0].count == 1) {
            response = {
                error: 1,
                message: 'gender already exists'
            }
        } else {
            let insertQuery = {
                text: 'INSERT INTO gender(name) VALUES ($1) RETURNING *',
                values: [name]
            }
            await client.query(insertQuery).then(res => {
                response = {
                    error: 0,
                    message: 'gender added',
                    data: res.rows
                }
            }).catch(err => {
                response = {
                    error: 1,
                    message: 'gender not added'
                }
                console.log(err);
            })
        }
    }).catch(e => {
        response = {
            error: 1,
            message: '404'
        }
        console.log(e);
    })
    return response;
}


// a function to add gender
module.exports.addColorController = async (name, color) => {
    name = name.trim();
    code = color.trim();
    let response
    query = 'SELECT COUNT(1) FROM colors WHERE colorcode=$1';
    values = [code];
    await client.query(query, values).then(async res => {
        if (res.rows[0].count == 1) {
            response = {
                error: 1,
                message: 'color already exists'
            }
        } else {
            let insertQuery = {
                text: 'INSERT INTO colors(name,colorcode) VALUES ($1,$2) RETURNING *',
                values: [name, code]
            }
            await client.query(insertQuery).then(res => {
                response = {
                    error: 0,
                    message: 'color added',
                    data: res.rows
                }
            }).catch(err => {
                response = {
                    error: 1,
                    message: 'color not added'
                }
                console.log(err);
            })
        }
    }).catch(e => {
        response = {
            error: 1,
            message: '404'
        }
        console.log(e);
    })
    return response;
}

// a function to add gender
module.exports.addProductTypeController = async (name) => {
    name = name.trim();
    let response
    query = 'SELECT COUNT(1) FROM producttype WHERE name=$1';
    values = [name];
    await client.query(query, values).then(async res => {
        if (res.rows[0].count == 1) {
            response = {
                error: 1,
                message: 'type already exists'
            }
        } else {
            let insertQuery = {
                text: 'INSERT INTO producttype(name) VALUES ($1) RETURNING *',
                values: [name]
            }
            await client.query(insertQuery).then(res => {
                response = {
                    error: 0,
                    message: 'type added',
                    data: res.rows
                }
            }).catch(err => {
                response = {
                    error: 1,
                    message: 'type not added'
                }
                console.log(err);
            })
        }
    }).catch(e => {
        response = {
            error: 1,
            message: '404'
        }
        console.log(e);
    })
    return response;
}

// a function to add category
module.exports.addCategoryController = async (name) => {
    name = name.trim();
    let response
    query = 'SELECT COUNT(1) FROM categories WHERE name=$1';
    values = [name];
    await client.query(query, values).then(async res => {
        if (res.rows[0].count == 1) {
            response = {
                error: 1,
                message: 'category already exists'
            }
        } else {
            let insertQuery = {
                text: 'INSERT INTO categories(name) VALUES ($1) RETURNING *',
                values: [name]
            }
            await client.query(insertQuery).then(res => {
                response = {
                    error: 0,
                    message: 'category added',
                    data: res.rows
                }
            }).catch(err => {
                response = {
                    error: 1,
                    message: 'category not added'
                }
                console.log(err);
            })
        }
    }).catch(e => {
        response = {
            error: 1,
            message: '404'
        }
        console.log(e);
    })
    return response;
}


// a function to add category
module.exports.addProducttypeController = async (name) => {
    name = name.trim();
    let response
    query = 'SELECT COUNT(1) FROM producttype WHERE name=$1';
    values = [name];
    await client.query(query, values).then(async res => {
        if (res.rows[0].count == 1) {
            response = {
                error: 1,
                message: 'category already exists'
            }
        } else {
            let insertQuery = {
                text: 'INSERT INTO producttype(name) VALUES ($1) RETURNING *',
                values: [name]
            }
            await client.query(insertQuery).then(res => {
                response = {
                    error: 0,
                    message: 'producttype added',
                    data: res.rows
                }
            }).catch(err => {
                response = {
                    error: 1,
                    message: 'producttype not added'
                }
                console.log(err);
            })
        }
    }).catch(e => {
        response = {
            error: 1,
            message: '404'
        }
        console.log(e);
    })
    return response;
}

// a function to delete gender
module.exports.delGenderController = async (id) => {
    let reponse;
    let text = 'DELETE FROM gender WHERE id=$1';
    values = [id];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: 'gender deleted'
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "gender not deleted"
        }
        console.log(e);
    })
    return reponse;
}

// a function to delete category
module.exports.delCategoryController = async (id) => {
    let response;
    let text = 'DELETE FROM categories WHERE id=$1';
    values = [id];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: 'category deleted'
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "category not deleted"
        }
        console.log(e);
    })
    return response;
}

// a function to delete category
module.exports.delProducttypeController = async (id) => {
    let response;
    let text = 'DELETE FROM producttype WHERE id=$1';
    values = [id];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: 'type deleted'
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "type not deleted"
        }
        console.log(e);
    })
    return response;
}

// a function to update category
module.exports.updCategoryController = async (id, name) => {
    let response;
    let text = 'UPDATE categories SET name=$2 WHERE id=$1';
    values = [id, name];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: 'category updated'
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "category not updated"
        }
        console.log(e);
    })
    return response;
}

// a function to update shop info
module.exports.updShopInfoController = async (id, location, phone, email, about) => {
    let response;
    let text = 'UPDATE shopinfo SET location=$2,phone=$3,email=$4,about=$5 WHERE id=$1';
    values = [id, location, phone, email, about];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: 'shop info updated'
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "shop info not updated"
        }
        console.log(e);
    })
    return response;
}


// a function to update blog content
module.exports.updBlogContentController = async (id, newlinktoimage, content, comments, title) => {
    let response;
    let text = 'UPDATE blog SET linktoimage=$2,content=$3,comments=$4,title=$5 WHERE id=$1';
    values = [id, newlinktoimage, content, comments, title];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: 'blog updated'
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "blog not updated"
        }
        console.log(e);
    })
    return response;
}


// a function to update color
module.exports.updColorController = async (id, name, colorcode) => {
    let response;
    let text = 'UPDATE colors SET name=$2,colorcode=$3 WHERE id=$1';
    values = [id, name, colorcode];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: 'color updated'
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "color not updated"
        }
        console.log(e);
    })
    return response;
}

// a function to update product type
module.exports.updProductTypeController = async (id, name) => {
    let response;
    let text = 'UPDATE producttype SET name=$2 WHERE id=$1';
    values = [id, name];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: 'type updated'
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "type not updated"
        }
        console.log(e);
    })
    return response;
}

// a function to update gender
module.exports.updGenderController = async (id, name) => {
    let response;
    let text = 'UPDATE gender SET name=$2 WHERE id=$1';
    values = [id, name];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: 'gender updated'
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "gender not updated"
        }
        console.log(e);
    })
    return response;
}

// a function to update product type
module.exports.updProducttypeController = async (id, name) => {
    let response;
    let text = 'UPDATE producttype SET name=$2 WHERE id=$1';
    values = [id, name];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: 'type updated'
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "type not updated"
        }
        console.log(e);
    })
    return response;
}

// a function to get carousel data
module.exports.getCarouselController = async () => {
    let response;
    let query = {
        text: 'SELECT * FROM carousel ORDER BY id DESC'
    }
    await client.query(query).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no carousel posts'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' posts',
                data: res.rows
            }
        }
    });
    return response;
}

// a function to update carousel data
module.exports.updCarouselController = async (imagelink, name, postid) => {
    let response;
    let query = {
        text: 'UPDATE carousel SET linktoimage=$1,name=$2 WHERE id=$3',
        values: [imagelink, name, postid]
    }
    await client.query(query).then(async res => {
        response = {
            error: 0,
            message: 'carousel updated'
        }
    }).catch(e => {
        response = {
            error: 1,
            message: "carousel not updated"
        }
        console.log(e);
    })
    return response;
}

// delete post
module.exports.delBlogContentController = async (postId) => {
    let response;
    let text = 'DELETE FROM blog WHERE id=$1';
    values = [postId];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: "blog deleted"
        };
    }).catch(e => {
        response = {
            error: 1,
            message: "blog not deleted "
        }
        console.log(e);
    })
    return response;
}

// delete product type
module.exports.delProductTypeController = async (id) => {
    let response;
    let text = 'DELETE FROM producttype WHERE id=$1';
    values = [id];
    await client.query(text, values).then(async res => {
        response = {
            error: 0,
            message: "product type deleted"
        };
    }).catch(e => {
        response = {
            error: 1,
            message: "product type not deleted "
        }
        console.log(e);
    })
    return response;
}

// send email message
module.exports.sendEmailController = async (email, message) => {
    let response;
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'cedro265@gmail.com',
            pass: 'Mzecedu!2'
        }
    });

    var mailOptions = {
        to: 'bahatipatrick05@gmail.com',
        subject: 'Email from Your e-commerce website',
        text: message + ' sentby ' + email
    };

    response = await transporter.sendMail(mailOptions).then(info => {
        return response = {
            error: 0,
            message: 'email sent'
        }
    }).catch(error => {
        return response = {
            error: 1,
            message: 'email not sent'
        }
    });
    return response;
}

// a function to handle searches
module.exports.searchController = async (value) => {
    let response;
    let query = {
        text: "SELECT * FROM posts WHERE name LIKE '%" + value + "%' OR description LIKE '%" + value + "%' ORDER BY id DESC",
    }
    await client.query(query).then(async res => {
        if (res.rows.length <= 0) {
            response = {
                error: 1,
                message: 'you have no posts'
            }
        } else {
            response = {
                error: 0,
                message: 'you have set ' + res.rows.length + ' posts',
                data: res.rows
            }
        }
    });
    return response;
}