const fetch = window.fetch

export default class PokemonService {
  _apiBase = 'https://pokeapi.co/api/v2';
  _imageBase = 'https://pokemongolife.ru/p/';

  constructor () {
    this.pokemonList = []
  }

  getResource = async (url) => {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Could not fetch ${url}, received ${res.status}`)
    }
    return res.json()
  };

  loadPokemonsStartData = async () => {
    const resource = await this.getResource(`${this._apiBase}/pokemon/?limit=950`)
    return resource
  }

  loadPokemons = async (limit, offset) => {
    const res = await this.getResource(`${this._apiBase}/pokemon/?limit=${limit}&offset=${offset}`)
    return this.loadData(res.results)
  };

  loadData = async (data) => {
    this.pokemonList.length = 0
    await this.putData(data)
      .then(res => {
        this.getPokemon(res)
      })
    return this.pokemonList
  }

  loadPokemonsAllTypes = async () => {
    const resource = await this.getResource(`${this._apiBase}/type/?limit=20`)
    return resource
  }

  loadPokemonsSelectedUrl = async (url) => {
    this.pokemonList.length = 0
    const res = await this.getResource(url)
    await this.putPokemonOfType(res.pokemon)
      .then(res => this.getPokemon(res))
    return this.pokemonList
  }

  loadPokemonsSelectedType = async (data) => {
    this.pokemonList.length = 0
    await this.putData(data)
      .then(res => {
        const listPokemon = res.map((data) => data.pokemon)
        let newListPokemon = listPokemon.reduce((a, b) => a.concat(b))
        return this.putPokemonOfType(newListPokemon)
      })
      .then(res => {
        this.getPokemon(res)
      })

    return this.pokemonList
  }

  putData = async (res) => {
    return Promise.all(res.map(async (data) => {
      const resource = await this.getResource(data.url)
      return resource
    }))
  }

  putPokemonOfType = async (res) => {
    return Promise.all(res.map(async (data) => {
      const resource = await this.getResource(data.pokemon.url)
      return resource
    }))
  }

  getPokemon = (data) => {
    data.map((item) => this.pokemonList.push(this._transformPokemon(item)))
  }


  _transformNameFromImage = (name) => {
    if (!name) return name

    let transformName = name
    const regExp = /(-m|-f)+$/g
    const result = name.match(regExp)

    if (result) {
      if (result[0] === '-m') {
        transformName = name.slice(0, -2) + '-male'
      }
      if (result[0] === '-f') {
        transformName = name.slice(0, -2) + '-female'
      }
    }
    return this._transformName(transformName)
  }

  _transformName = (name) => {
    return name[0].toUpperCase() + name.slice(1)
  }

  _transformTypes = (types) => {
    return types.map((type) => {
      return ({
        id: type.slot,
        name: type.type.name,
        url: type.type.url
      })
    })
  }

  _transformPokemon = (pokemon) => {
    return {
      id: pokemon.id,
      name: this._transformName(pokemon.name),
      types: this._transformTypes(pokemon.types),
      image: `${this._imageBase}${this._transformNameFromImage(pokemon.name)}.png`,
      imageSecond: pokemon.sprites.front_default,
      imageNull: '',
      baseExperience: pokemon.base_experience
    }
  }
}
