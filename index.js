let vars;

//modifies the a tag
class AHandler{
	element(element){
		const attribute = element.getAttribute('href')
		if(attribute){
			element.setAttribute('href', 'https://afarooqui98.github.io/')
		}
	}

	text(text){
		text.remove()
		if(text.lastInTextNode){
			text.after("Go to personal website")
		}
	}
}

//modifies the description
class DescHandler{
	text(text){
		text.remove()
		if(text.lastInTextNode){
			text.after("This button will take you to my personal site!")
		}
	}
}

addEventListener('fetch', event => {
  return event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const endpoint = await Promise.resolve(parseEndpoint(request))

  if (endpoint == "/api/variants"){ //A/B testing style page serving with cookies 
  	const cookie = request.headers.get("cookie")

  	//fetch variant
  	const response_1 = await fetch(vars[0]) 
  	const response_2 = await fetch(vars[1])

  	const rewriter = new HTMLRewriter().on('a#url', new AHandler()).on('p#description', new DescHandler())

  	//use this to add a cookie to the header, as responses from fetch are immutable, then transform with HTMLRewriter
  	const variant_1 = new Response(rewriter.transform(response_1).body)
  	const variant_2 = new Response(rewriter.transform(response_2).body)

  	if (cookie && cookie.includes(`visited=variant_1`)) {
  		return variant_1
  	} else if (cookie && cookie.includes(`visited=variant_2`)) {
  		return variant_2
  	} else {
  		//50/50 on first client load
  		let group = Math.random() < 0.5 ? "variant_1" : "variant_2"
  		let response = group === "variant_1" ? variant_1 : variant_2
  		response.headers.set("Set-Cookie", `visited=${group}`)
  		return response
  	}
  }

  if (endpoint == "/"){ //Default endpoint
	  const response = await fetch(url, {"url": url, headers : {'content-type' : type}})
	  const result = await Promise.resolve(gatherResponse(response))
	  vars = result.variants
	  return new Response(page, {"url": url, headers : {'content-type' : page_type}})
  }

}

//handle the two different endpoints, default and /api/variants
async function parseEndpoint(request) {
	var args = request.url.split("/")
	if (args[args.length-2] == "api" && args[args.length-1] == "variants"){
		return "/" + args[args.length-2] + "/" + args[args.length-1]
	} else{
		return "/"
	}
}

//only need to return JSON to store in variable
async function gatherResponse(response) {
    return await response.json()
}


const host = 'https://cfw-takehome.developers.workers.dev'
const url = host + '/api/variants'
const type = 'application/json;charset=UTF-8'
const page = '<html><body><a href="" id="url">Variants saved. Press to load variant</a></body><script type="text/javascript">window.onload = function(){document.getElementById("url").href = window.location.toString() + "api/variants";}</script></html>'
const page_type = 'text/html'


