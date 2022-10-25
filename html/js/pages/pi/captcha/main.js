class Captcha {
	constructor () {
		let tag = document.getElementById("captcha")
		tag.addEventListener("click", this._MakeNew.bind(this))

	}

	Do() {
		this._MakeNew()
	}

	async _MakeNew() {
		let captcha_id = await this._GetNewID()
		let tag = document.getElementById("captcha")
		if(tag) {
			tag.src = "/captcha/" + captcha_id + ".png"
		} else {
			console.error("captcha tag not found")
		}
	}

	async _GetNewID() {
        return fetch("/captcha/getnew?rand=" + Math.random() * 76543567890)
                .then(response => {
                        if (response.ok) {
                        	// --- ok
                        } else {
                            throw new Error(`HTTP error! Status: ${ response.status }`);
                        }
        
                        return response.json();
                })
                .then(data => {
                        if(data.captcha_id.length) {
                        	return data.captcha_id;
                        } else {
                        	system_calls.PopoverError($("body"), "Ошибка: " + data.description);
                        }
                })
                .catch(err => {throw new Error(err)});
	}
}

let obj = new Captcha()
obj.Do()
