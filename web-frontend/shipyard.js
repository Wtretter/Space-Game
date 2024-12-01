const base_url = window.location.protocol+"//"+window.location.hostname+":42000";
let token = null;


async function create_ship(ship_name){
    try {
        console.log(token)
        const response = await fetch(base_url+"/ship/create", {
            "method": "POST",
            "body": JSON.stringify({ship_name: ship_name, token: token}),
            "headers": {"Content-Type": "application/json"}
        });
        if (response.status != 200){
            return null
        }
        return await response.json();
    } catch {
        return null;
    }
} 


window.addEventListener("load", async ()=>{
    const create_button = document.querySelector(".create-ship");
    create_button.addEventListener("click", async () => {
        const ship_name = document.querySelector(".ship-name").value;
        token = JSON.parse(localStorage.getItem("token"))
        await create_ship(ship_name)


        location.replace("/");
    });
});
