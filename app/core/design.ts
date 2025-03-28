import { Dungeon, TerrainType, Mask } from "../types/Config"
import Tileset, { TilesetTiled } from "./tileset"
import Terrain from "./terrain"
import Masker from "./masker"
import { logger } from "../utils/logger"

export type LayerTiled = {
  data: number[]
  height: number
  id: number
  name: string
  opacity: number
  type: string
  visible: boolean
  width: number
  x: number
  y: number
}

export type DesignTiled = {
  compressionlevel: number
  height: number
  infinite: boolean
  layers: LayerTiled[]
  nextlayerid: number
  nextobjectid: number
  orientation: string
  renderorder: string
  tiledversion: string
  tileheight: number
  tilesets: TilesetTiled[]
  tilewidth: number
  type: string
  version: string
  width: number
}

export default class Design {
  id: Dungeon
  terrain: TerrainType[][] = []
  bitmask: Mask[][] = []
  tilemap: number[] = []
  width = 42
  height = 22
  frequency: number
  persistance: number
  tileset: Tileset
  arenaRect: [x1: number, y1: number, x2: number, y2: number] = [13, 2, 29, 18]
  wallRect: [x1: number, y1: number, x2: number, y2: number] = [14, 15, 28, 15]

  constructor(
    id: Dungeon,
    frequency: number,
    persistance: number,
    width?: number,
    height?: number,
    arenaRect?: [x1: number, y1: number, x2: number, y2: number],
    wallRect?: [x1: number, y1: number, x2: number, y2: number]
  ) {
    this.id = id
    this.frequency = frequency
    this.persistance = persistance
    this.width = width ?? this.width
    this.height = height ?? this.height
    this.arenaRect = arenaRect ?? this.arenaRect
    this.wallRect = wallRect ?? this.wallRect
    this.tileset = new Tileset(this.id)
  }

  async create() {
    return new Promise<void>((resolve, reject) => {
      this.tileset.initialize().then(() => {
        this.generateTerrain()
        this.generateMask()
        this.generateTilemap()
        resolve()
      })
    })
  }

  generateTerrain() {
    const t = new Terrain(
      this.width,
      this.height,
      this.frequency,
      this.persistance
    )
    const generation = t.terrain

    for (let i = 0; i < this.height; i++) {
      const row: number[] = []
      for (let j = 0; j < this.width; j++) {
        const v = generation[i][j]
        if (v > 0.66) {
          row.push(TerrainType.WALL)
        } else if (v > 0.33) {
          row.push(TerrainType.GROUND)
        } else {
          row.push(TerrainType.WATER)
        }
      }
      this.terrain.push(row)
    }

    for (let i = this.arenaRect[0]; i <= this.arenaRect[2]; i++) {
      for (let j = this.arenaRect[1]; j <= this.arenaRect[3]; j++) {
        if (j in this.terrain && i in this.terrain[j]) {
          this.terrain[j][i] = TerrainType.GROUND
        } else {
          logger.error(`Arena rect is out of terrain`, {
            arenaRect: this.arenaRect,
            width: this.width,
            height: this.height
          })
        }
      }
    }

    for (let i = this.wallRect[0]; i <= this.wallRect[2]; i++) {
      for (let j = this.wallRect[1]; j <= this.wallRect[3]; j++) {
        if (j in this.terrain && i in this.terrain[j]) {
          if (
            i === this.wallRect[0] ||
            j === this.wallRect[1] ||
            i === this.wallRect[2] ||
            j === this.wallRect[3]
          ) {
            this.terrain[j][i] = TerrainType.WALL
          }
        } else {
          logger.error(`Wall rect is out of terrain`, {
            wallRect: this.wallRect,
            width: this.width,
            height: this.height
          })
        }
      }
    }

    this.drawGroundRect(9, 13, 3, 3)
    this.drawGroundRect(30, 1, 3, 3)
  }

  drawGroundRect(x: number, y: number, width: number, height: number) {
    for (let i = x; i < x + width; i++) {
      for (let j = y; j < y + height; j++) {
        if (j in this.terrain && i in this.terrain[j]) {
          this.terrain[j][i] =
            i === x || i === x + width - 1 || j === y || j === y + height - 1
              ? TerrainType.WALL
              : TerrainType.GROUND
        }
      }
    }
  }

  generateMask() {
    const masker = new Masker()
    for (let i = 0; i < this.height; i++) {
      const row = new Array<Mask>()
      for (let j = 0; j < this.width; j++) {
        row.push(masker.mask8bits(this.terrain, i, j))
      }
      this.bitmask.push(row)
    }
  }

  generateTilemap() {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        const tileID = this.tileset.getTilemapId(
          this.terrain[i][j],
          this.bitmask[i][j]
        )
        this.tilemap.push(tileID)
      }
    }
  }

  exportToTiled() {
    return {
      compressionlevel: -1,
      height: this.height,
      infinite: false,
      layers: [
        {
          data: this.tilemap,
          height: this.height,
          id: 1,
          name: "World",
          opacity: 1,
          type: "tilelayer",
          visible: true,
          width: this.width,
          x: 0,
          y: 0
        }
      ],
      nextlayerid: 6,
      nextobjectid: 1,
      orientation: "orthogonal",
      renderorder: "right-down",
      tiledversion: "1.7.2",
      tileheight: 24,
      tilesets: [this.tileset.exportToTiled()],
      tilewidth: 24,
      type: "map",
      version: "1.6",
      width: this.width
    }
  }
}
