# Freecount

The progressive web app to share expenses among friends, useful during trips!

It is heavily inspired by [Tricount](https://www.tricount.com/), but completely free and open source. It makes use of https://jsonbox.io/ to store the expenses.

## FAQ

- **I want to use it now, what do I do?** Open https://freecount.s10a.dev/ (beta)
- **I am afraid my friends alter past expenses to screw me over.** Then you should use another tool, or change friends. Although Freecount is designed with immutable data in mind, jsonbox.io allows to DELETE or PUT past data via its API, meaning that immutability is not guaranteed.
- **I want to self-host Freecount.** Please go ahead, it is a 100% static web app super easy to serve.
- **I want to self-host the data too.** It turns out [jsonbox](https://github.com/vasanthv/jsonbox) is also self-hostable, but right now the API endpoint is not configurable in Freecount. This would be easy to implement though, and pull requests are welcome.
- **Which trendy js framework is Freecount written in?** The latest version of [Vanilla js](http://vanilla-js.com/). And there is not even a build pipeline, your browser will run the code as it was typed, like in 2010.
