function startApp() {
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_r1i5AU0bV";
    const kinveyAppSecret = "3f3a391f89cb44c49e0cdf154d0053ac";
    const kinveyAppAuthHeaders = {
        "Authorization": "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret)
    };


    sessionStorage.clear();
    showHideMenuLinks();
    showAppHomeView();


    $('#loginBtn').click(showLoginForm);
    $('#registerBtn').click(showRegisterForm);
    $('#signIn').click(showRegisterForm);
    $('#home').click(showAppHomeView);
    $('#myProfile').click(showMyProgile);

    $('#registerForm').submit(registerUser);
    $('#loginForm').submit(loginUser);
    $('#logoutBtn').click(logout);

    $('#showCreatePage').click(showCreatePage);
    $('#createMemeForm').submit(createMeme);


    $('#infoBox, #errorBox').click(function () {
        $(this).fadeOut();
    });

    function showView(viewName) {
        $('main > div').hide();
        $('#' + viewName).show();
    }

    function showLoginForm() {
        showView('login');
    }

    function showRegisterForm() {
        showView('register');
    }

    function loginUser(event) {
        event.preventDefault();

        let userData = {
            username: $('#loginForm input[name=username]').val(),
            password: $('#loginForm input[name=password]').val()
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/login",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: loginSuccess,
            error: handleAjaxError
        });

        function loginSuccess(userInfo) {
            $('form input[type=text], form input[type=password]').val('');
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showAllMemes();
            showInfo('Login successful.');
        }
    }

    function registerUser(event) {
        event.preventDefault();
        let userData = {
            username: $('#registerForm input[name=username]').val(),
            password: $('#registerForm input[name=password]').val(),
            email: $('#registerForm input[name=email]').val(),
            avatarUrl: $('#registerForm input[name=avatarUrl]').val(),
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });

        function registerSuccess(userInfo) {
            $('form input[type=text], form input[type=password]').val('');
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showAllMemes();
            showInfo('User registration successful.');
        }
    }


    $(document).on({
        ajaxStart: function () {
            $('#loadingBox').show();
        },
        ajaxStop: function () {
            $('#loadingBox').hide();
        }
    });

    function showHideMenuLinks() {
        $('main > div').hide();
        if (sessionStorage.getItem('authToken')) {
            $('.useronly').show();
            $('.anonymous').show();
        } else {
            $('.anonymous').show();
            $('.useronly').hide();
        }
    }


    function showAppHomeView() {
        if (sessionStorage.getItem('authToken')) {
            showAllMemes();
        }
        else {
            showView('main');
        }

    }

    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0) {
            errorMsg = "Cannot connect due to network error.";
        }
        if (response.responseJSON && response.responseJSON.description) {
            errorMsg = response.responseJSON.description;
        }

        showError(errorMsg);
    }

    function showInfo(message) {
        $('#infoBox').show();
        $('#infoBox > span').text(message);
        setTimeout(function () {
            $('#infoBox').fadeOut()
        }, 3000)
    }

    function showError(errorMsg) {
        $('#errorBox').show();
        $('#errorBox > span').text(errorMsg);
        setTimeout(function () {
            $('#errorBox > span').fadeOut();
        }, 3000);
    }


    function getKinveyUserAuthHeaders() {
        return {
            "Authorization": "Kinvey " + sessionStorage.getItem('authToken')
        };
    }


    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        sessionStorage.setItem('username', username);
        $('#welcome-user').text("Welcome, " + username + "!");

    }

    function logout() {
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/_logout",
            headers: getKinveyUserAuthHeaders()
        }).then(() => {
            sessionStorage.clear();
            showHideMenuLinks();
            showAppHomeView();
            showInfo('Logout successful.');
        }).catch(handleAjaxError)
    }

    function showAllMemes() {


        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + `/memes?query={}&sort={"_kmd.ect": -1}`,
            headers: getKinveyUserAuthHeaders(),
            success: successMemes,
            error: handleAjaxError
        });

        function successMemes(response) {
            if (response.length === 0) {
                $('main').append('<p class="no-memes">No memes in database.</p>')
            } else {
                $('#memes').empty();
                for (let obj of response) {
                    showView('meme-feed');
                    let meme = $('<div class="meme">\n' +
                        `<a href="#" class="meme-title">${obj.title}</a>\n` +
                        '<br>\n' +
                        '<a href="#"><img class="meme-image"\n' +
                        `src="${obj.imageUrl}"></a>\n` +
                        '<div class="info">\n' +
                        '\n');
                    let buttons = $('<div id="data-buttons">\n');

                    let checkOutBtn = $('<a href="#" class="custom-button">Check Out</a>').on('click', () => descriptionSectionShow(obj))
                    buttons.append(checkOutBtn);
                    if (obj.creator === sessionStorage.getItem('username')) {
                        let editBtn = $('<a href="#" class="custom-button">Edit</a>\n').on('click', () => editMeme(obj));
                        buttons.append(editBtn);
                        let feleteBtn = $('<a href="#" class="custom-button" >Delete</a>\n').on('click', () => deleteMeme(obj));
                        buttons.append(feleteBtn);

                    }
                    buttons.append(`<a href="#" class="creator">Creator: ${obj.creator}</a>\n` +
                        '                        </div>\n' +
                        '                    </div>\n' +
                        '                    <hr>\n' +
                        '                </div>');

                    meme.append(buttons);
                    $('#memes').append(meme);

                }
            }
        }
    }


    function showCreatePage() {
        showView('create-meme');
    }

    function createMeme() {
        event.preventDefault();

        let memeData = {
            title: $('#createMemeForm input[name=title]').val(),
            description: $('#createMemeForm input[name=description]').val(),
            imageUrl: $('#createMemeForm input[name=imageUrl]').val(),
            creator: sessionStorage.getItem('username')
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/memes",
            headers: getKinveyUserAuthHeaders(),
            data: memeData,
            success: createdMeme,
            error: handleAjaxError
        });

        function createdMeme(responce) {
            $('#createMemeForm').trigger('reset');
            showAllMemes();
            showInfo('Meme created successful.');
        }
    }

    function deleteMeme(item) {
        event.preventDefault();

        $.ajax({
            method: "DELETE",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/memes/" + item._id,
            headers: getKinveyUserAuthHeaders()
        }).then(function (res) {
            showAllMemes();
            showInfo('Meme removed successfully!');
        }).catch(handleAjaxError);
    }

    function editMeme(meme) {
        showView('edit-meme');
        $('#editMemeForm input[name=title]').val(meme.title);
        $('#editMemeForm input[name=description]').val(meme.description);
        $('#editMemeForm input[name=imageUrl]').val(meme.imageUrl);
        $('#editMemeForm').submit(() => postEdit(meme));
    }

    function postEdit(meme) {
        event.preventDefault();

        let data = {
            title: $('#editMemeForm input[name=title]').val(),
            description: $('#editMemeForm input[name=description]').val(),
            imageUrl: $('#editMemeForm input[name=imageUrl]').val(),
            creator: sessionStorage.getItem('username')
        };

        $.ajax({
            method: "PUT",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/memes/" + meme._id,
            headers: getKinveyUserAuthHeaders(),
            data: data,
            success: editSuccess,
            error: handleAjaxError
        });

        function editSuccess(res) {
            $('#editMemeForm').trigger('reset');
            showInfo(`Updated successfully!`);
            showAllMemes();
        }
    }


    function showMyProgile() {
        $('#user-profile').empty();
        showView('user-profile');
        let userId = sessionStorage.getItem('userId');

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/" + userId,
            headers: getKinveyUserAuthHeaders(),
            success: showProfile,
            error: handleAjaxError
        });

        function showProfile(res) {
            triggerUserProfile(res);
            triggerUserMemes(res);

        }
    }

    function triggerUserProfile(res) {
        let prof = $(`<img id="user-avatar-url" src="${res.avatarUrl}"\n
                                 alt="user-profile">\n
                            <h1>${res.username}</h1>\n
                            <h2>${res.email}</h2>\n 
                \n`);
        let del = $('<a id="deleteUserButton" href="#">DELETE USER!</a>').on('click', () => deleteUser(res));

        let listings = $(`            \n
                \n
                            <p id="user-listings-title">User Memes</p><div class="user-meme-listings"></div>`);


        $('#user-profile').append(prof);
        $('#user-profile').append(del);
        $('#user-profile').append(listings);
    }

    function triggerUserMemes(res) {
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + `/memes?query={"creator":"${res.username}"}&sort={"_kmd.ect": -1}`,
            headers: getKinveyUserAuthHeaders(),
            success: successTrigMemes,
            error: handleAjaxError
        });


        function successTrigMemes(response) {
            if (response.length === 0) {
                $('#user-profile').append('<p class="no-memes">No memes in database.</p>')
            } else {
                for (let obj of response) {

                    let div = $('<div class="user-meme"></div>');
                    div.append(`<a href="#" class="user-meme-title">${obj.title}</a>
                    <a href=""> <img class="userProfileImage"
                                     src="${obj.imageUrl}"></a>`);
                    let buttons = $('<div class="user-memes-buttons"></div>');
                    let editB = $('<a href="#" class="user-meme-btn">Edit</a>').click(() => editMeme(obj));
                    let deleteB = $('<a href="#" class="user-meme-btn">Delete</a>').click(() => deleteMeme(obj));
                    buttons.append(editB);
                    buttons.append(deleteB);
                    div.append(buttons);
                    div.appendTo('.user-meme-listings');
                }
            }
        }
    }


    function deleteUser(res) {

        $.ajax({
            method: 'DELETE',
            url: kinveyBaseUrl + 'user/' + kinveyAppKey + `/${res._id}`,
            headers: getKinveyUserAuthHeaders(),
            success: successDeleteUser,
            error: handleAjaxError
        });

        function successDeleteUser(res) {
            sessionStorage.clear();
            showHideMenuLinks();
            showView('main');
            showInfo('User deleted');
        }
    }


    function descriptionSectionShow(res) {
        console.log('hello')
        
    }
}