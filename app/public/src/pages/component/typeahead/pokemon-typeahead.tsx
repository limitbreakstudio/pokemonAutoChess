import React, { useMemo } from "react"
import { Typeahead } from "react-bootstrap-typeahead"

import { TypeaheadProps } from "./types"

import { PrecomputedRaritPokemonyAll } from "../../../../../types"
import PRECOMPUTED_RARITY_POKEMONS_ALL from "../../../../../models/precomputed/type-rarity-all.json"
import { Pkm } from "../../../../../types/enum/Pokemon"
import { useTranslation } from "react-i18next"

const precomputed =
  PRECOMPUTED_RARITY_POKEMONS_ALL as PrecomputedRaritPokemonyAll

export function PokemonTypeahead({ onChange, value }: TypeaheadProps<Pkm>) {
  const pokemonOptions = useMemo(() => Object.values(precomputed).flat(), [])
  const { t } = useTranslation()

  return (
    <Typeahead
      id="pokemon-typeahead"
      defaultInputValue={value}
      options={pokemonOptions}
      placeholder={t("select_pokemon")}
      onChange={(option) => {
        const val = option[0] as Pkm
        onChange(val)
      }}
    />
  )
}
