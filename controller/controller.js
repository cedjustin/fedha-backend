// importing dependencies
const {
    Client
} = require('pg');
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
module.exports.addPostController = async (categoryid, description, linkToImage, inStock, discountexp, onsale, saleexp, amount, genderId, rate) => {
    getTimeStamp = await _getTimeStamp();
    categoryid = categoryid;
    description = description.trim();
    linkToImage = linkToImage.replace('dl=0', 'raw=1');
    genderId = genderId.trim();
    let response;
    let postExists = await checkIfPostExists(categoryid, description, amount);
    if (postExists) {
        response = {
            error: 1,
            message: 'post arleady exist'
        }
    } else {
        let insertQuery = {
            text: 'INSERT INTO posts(catid,datecreated,description,linktoimage,instock,discountexp,onsale,saleexp,amount,genderid,rate) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
            values: [categoryid, getTimeStamp, description, linkToImage, inStock, discountexp, onsale, saleexp, amount, genderId, rate]
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
module.exports.updPostController = async (categoryid, description, linkToImage, inStock, discountexp, onsale, saleexp, amount, genderId, rate, postId) => {
    description = description.trim();
    linkToImage = linkToImage.replace('dl=0', 'raw=1');
    let response;
    let updatePostQuery = {
        text: 'UPDATE posts SET catid=$1,description=$2,linktoimage=$3,instock=$4,discountexp=$5,onsale=$6,saleexp=$7,amount=$8,rate=$9 WHERE id=$10',
        values: [categoryid, description, linkToImage, inStock, discountexp, onsale, saleexp, amount, rate,postId]
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
        text: 'SELECT id,catid,datecreated,description,linktoimage,instock,discountexp,onsale,saleexp,amount,rate,genderid FROM posts ORDER BY ' + sortby + ' ' + order + ' OFFSET $1 FETCH FIRST 10 ROWS ONLY',
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


//a function to get posts which are only on sales
module.exports.getPostsOnSaleController = async (offset, order, sortby) => {
    let response;
    getPostsQuery = {
        text: 'SELECT id,catid,datecreated,description,linktoimage,instock,discountexp,onsale,saleexp,amount,rate FROM posts WHERE onsale = $1 ORDER BY ' + sortby + ' ' + order + ' OFFSET $2 FETCH FIRST 10 ROWS ONLY',
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
        text: 'SELECT id,catid,datecreated,description,linktoimage,instock,discountexp,onsale,saleexp,amount,rate FROM posts WHERE discountexp != $1 ORDER BY ' + sortby + ' ' + order + ' OFFSET $2 FETCH FIRST 10 ROWS ONLY',
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
module.exports.getGenderController = async (offset, order, sortby) => {
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

//a function to get gender 
module.exports.getCategoryController = async (offset, order, sortby) => {
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


// module.exports.getMonthlyBudgetsController = async (userid, timestamp) => {
//     let response;
//     userexists = await checkIfUserExists(userid);
//     if (userexists == 'user exists') {
//         getBudgetQuery = {
//             text: 'SELECT amount,timestamp,remaining,expired FROM budget WHERE userid=$1 AND timestamp=$2',
//             values: [userid, timestamp]
//         }
//         await client.query(getBudgetQuery).then(async res => {
//             if (res.rows.length <= 0) {
//                 response = {
//                     error: 1,
//                     message: 'you have no budget for this month'
//                 }
//             } else {
//                 response = {
//                     error: 0,
//                     message: 'success',
//                     data: res.rows
//                 }
//             }
//         }).catch(e => {
//             console.log(e);
//             response = {
//                 error: 1,
//                 message: "404"
//             };
//         })
//     } else {
//         response = {
//             error: 1,
//             message: "user doesn't exists"
//         }
//     }
//     return response;
// }

// // function to get all budgets
// module.exports.getTypesController = async (userid) => {
//     let response;
//     userexists = await checkIfUserExists(userid);
//     if (userexists == 'user exists') {
//         getTypesQuery = {
//             text: 'SELECT id,types_description,image,color FROM types ORDER BY id DESC'
//         }
//         await client.query(getTypesQuery).then(async res => {
//             if (res.rows.length <= 0) {
//                 response = {
//                     error: 1,
//                     message: 'there are no types'
//                 }
//             } else {
//                 response = {
//                     error: 0,
//                     message: 'there are ' + res.rows.length + ' types',
//                     data: res.rows
//                 }
//             }
//         }).catch(e => {
//             console.log(e);
//             response = {
//                 error: 1,
//                 message: "404"
//             };
//         })
//     } else {
//         response = {
//             error: 1,
//             message: "user doesn't exists"
//         }
//     }
//     return response;
// }

// // activities controllers

// // get activities
// module.exports.getActivitiesController = async (userid, timestamp) => {
//     let response;
//     userexists = await checkIfUserExists(userid);
//     if (userexists == 'user exists') {
//         getTypesQuery = {
//             text: `SELECT activities.id,activities.type_id,activities.description,
//             activities.budget_id,activities.amount,activities.user_id,activities.timestamp FROM activities
//             WHERE activities.user_id=$1 AND activities.timestamp=$2 ORDER BY id DESC`,
//             values: [userid, timestamp]
//         }
//         await client.query(getTypesQuery).then(async res => {
//             if (res.rows.length <= 0) {
//                 response = {
//                     error: 1,
//                     message: 'there are no activities'
//                 }
//             } else {
//                 response = {
//                     error: 0,
//                     message: 'there are ' + res.rows.length + ' activities',
//                     data: res.rows
//                 }
//             }
//         }).catch(e => {
//             console.log(e);
//             response = {
//                 error: 1,
//                 message: "404"
//             };
//         })
//     } else {
//         response = {
//             error: 1,
//             message: "user doesn't exists"
//         }
//     }
//     return response;
// }


// // set activities
// module.exports.updActivityController = async (typeid, description, budget, amount, userid, timestamp, activityid) => {
//     userid = userid.trim();
//     budget = budget.trim();
//     description = description.trim();
//     amount = amount.trim();
//     typeid = typeid.trim();
//     timestamp = timestamp.trim();
//     activityid = activityid.trim();
//     let response;
//     userexists = await checkIfUserExists(userid);
//     if (userexists == 'user exists') {
//         let updateQuery = {
//             text: 'UPDATE activities SET type_id=$1,description=$2,budget_id=$3,amount=$4,user_id=$5,timestamp=$6 WHERE id=$7',
//             values: [typeid, description, budget, amount, userid, timestamp, activityid]
//         }
//         await client.query(updateQuery).then(async res => {
//             response = await this.getActivitiesController(userid, timestamp);
//         }).catch(e => {
//             console.log(e);
//             response = {
//                 error: 1,
//                 message: "404",
//             };
//         })
//     } else {
//         response = {
//             error: 1,
//             message: "user doesn't exists"
//         }
//     }
//     return response;
// }

// // set activities
// module.exports.addActivityController = async (typeid, description, budget, amount, userid, timestamp) => {
//     userid = userid.trim();
//     budget = budget.trim();
//     description = description.trim();
//     amount = amount.trim();
//     typeid = typeid.trim();
//     timestamp = timestamp.trim();
//     let response;
//     userexists = await checkIfUserExists(userid);
//     if (userexists == 'user exists') {
//         let text = 'SELECT COUNT(1) FROM activities WHERE timestamp=$1 AND amount=$2 AND description=$3';
//         values = [timestamp, amount, description];
//         await client.query(text, values).then(async res => {
//             if (res.rows[0].count == 1) {
//                 response = {
//                     error: 1,
//                     message: "activity already exists"
//                 };
//             } else {
//                 let insertQuery = {
//                     text: 'INSERT INTO activities(type_id,description,budget_id,amount,user_id,timestamp) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
//                     values: [typeid, description, budget, amount, userid, timestamp]
//                 }
//                 await client.query(insertQuery).then(async res => {
//                     let activities = await this.getActivitiesController(userid, timestamp);
//                     response = {
//                         error: 0,
//                         message: 'Proceed',
//                         data: activities
//                     }
//                 }).catch(e => {
//                     console.log(e);
//                     response = {
//                         error: 1,
//                         message: "404"
//                     };
//                 })
//             }
//         }).catch(e => {
//             console.log(e);
//         })
//     } else {
//         response = {
//             error: 1,
//             message: "user doesn't exists"
//         }
//     }
//     return response;
// }

// // delete activities
// module.exports.delActivityController = async (userid, activityid) => {
//     userid = userid.trim();
//     activityid = activityid.trim();
//     let response;
//     userexists = await checkIfUserExists(userid);
//     if (userexists == 'user exists') {
//         let text = 'DELETE FROM activities WHERE id=$1';
//         values = [activityid];
//         await client.query(text, values).then(async res => {
//             response = {
//                 error: 0,
//                 message: "activity deleted"
//             }
//         }).catch(e => {
//             response = {
//                 error: 1,
//                 message: "activity not deleted"
//             }
//             console.log(e);
//         })
//     } else {
//         response = {
//             error: 1,
//             message: "user doesn't exists"
//         }
//     }
//     return response;
// }

// end of controllers