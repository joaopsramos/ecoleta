import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { Map, TileLayer, Marker } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet'
import { FiArrowLeft } from 'react-icons/fi'
import axios from 'axios'

import './styles.css'
import logo from '../../assets/logo.svg'

import api from '../../services/api'

import Dropzone from '../../components/Dropzone'

interface IBGE_UF_Response {
    id: number
    sigla: string
    nome: string
    regiao: {
        id: number
        sigla: string
        nome: string
    }
}

interface IBGE_CityByUF_Response {
    id: number
    nome: string
    microrregiao: {
        id: number
        nome: string
        mesorregiao: {
            id: number
            nome: string
            sigla: string
            UF: {
                id: number
                sigla: string
                nome: string
                regiao: {
                    id: number
                    sigla: string
                    nome: string
                }
            }
        }
    }
}

interface City {
    id: number
    name: string
}

interface UF {
    id: number
    initials: string
}

interface Item {
    id: number
    title: string
    image_url: string
}

const CreatePoint = () => {
    const [initialMapPosition, setInitialMapPosition] = useState<[number, number]>([0, 0])
    const [mapPoint, setMapPoint] = useState<[number, number]>([0, 0])

    const [ufs, setUfs] = useState<UF[]>([])
    const [cities, setCities] = useState<City[]>([])
    const [items, setItems] = useState<Item[]>([])

    const [selectedFile, setSelectedFile] = useState<File>()
    const [inputData, setInputData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    })
    const [selectedUf, setSelectedUf] = useState('0')
    const [selectedCity, setSelectedCity] = useState('0')
    const [selectedItems, setSelectedItems] = useState<number[]>([])

    const history = useHistory()

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords

            setInitialMapPosition([latitude, longitude])
        })
    }, [])

    useEffect(() => {
        api.get('items').then((response) => {
            setItems(response.data)
        })
    }, [])

    useEffect(() => {
        axios
            .get<IBGE_UF_Response[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then((response) => {
                const uf = response.data.map((uf) => ({ id: uf.id, initials: uf.sigla }))

                setUfs(uf)
            })
    }, [])

    useEffect(() => {
        if (selectedUf === '0') {
            setCities([])
            return
        }

        axios
            .get<IBGE_CityByUF_Response[]>(
                `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`
            )
            .then((response) => {
                const cities = response.data.map((city) => ({ id: city.id, name: city.nome }))

                setCities(cities)
            })
    }, [selectedUf])

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value

        setSelectedUf(uf)
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value

        setSelectedCity(city)
    }

    function handleMapClick(event: LeafletMouseEvent) {
        setMapPoint([event.latlng.lat, event.latlng.lng])
    }

    function handleImputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target

        setInputData({ ...inputData, [name]: value })
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItems.findIndex((itemId) => itemId === id)

        if (alreadySelected !== -1) {
            const filteredItems = selectedItems.filter((itemId) => itemId !== id)

            setSelectedItems(filteredItems)

            return
        }

        setSelectedItems([...selectedItems, id])
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()

        const { name, email, whatsapp } = inputData
        const [latitude, longitude] = mapPoint
        const uf = selectedUf
        const city = selectedCity
        const items = selectedItems

        const data = new FormData()

        data.append('name', name)
        data.append('email', email)
        data.append('whatsapp', whatsapp)
        data.append('uf', uf)
        data.append('city', city)
        data.append('latitude', String(latitude))
        data.append('longitude', String(longitude))
        data.append('items', items.join(','))

        if (selectedFile) {
            data.append('image', selectedFile)
        }

        await api.post('points', data)

        alert('Ponto de coleta criado!')

        history.push('/')
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />

                <Link to={'/'}>
                    <FiArrowLeft />
                    Voltar para home{' '}
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>
                    Cadastro do <br /> ponto de coleta
                </h1>

                <Dropzone onFileUploaded={setSelectedFile} />

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        {/* prettier-ignore */}
                        <input 
                            type="text" 
                            name="name"
                            id="name"
                            onChange={handleImputChange}
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            {/* prettier-ignore */}
                            <input 
                                type="email" 
                                name="email"
                                id="email"
                                onChange={handleImputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            {/* prettier-ignore */}
                            <input 
                                type="text" 
                                name="whatsapp"
                                id="whatsapp"
                                onChange={handleImputChange}
                            />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialMapPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={mapPoint} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            {/* prettier-ignore */}
                            <select 
                                name="uf"
                                id="uf"
                                value={selectedUf}
                                onChange={handleSelectUf}
                            >
                                <option value="0">Selecione uma UF</option>
                                {ufs.map((uf) => (
                                    <option key={uf.id} value={uf.initials}>
                                        {uf.initials}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            {/* prettier-ignore */}
                            <select 
                                name="city"
                                id="city"
                                value={selectedCity}
                                onChange={handleSelectCity}
                            >
                                <option value="0">Selecione uma cidade</option>
                                {cities.map((city) => (
                                    <option key={city.id} value={city.name}>
                                        {city.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Itens de coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ''}
                            >
                                <img src={item.image_url} alt="teste" />
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    )
}

export default CreatePoint
