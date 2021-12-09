const { expect } = require("chai");
import { promises as fs } from 'fs'
import { sha256FromBuf } from "../src/sha256Converter"

describe.only('Hashing Utilities', () => {
	let Hash: string

	beforeEach(() => {
		Hash = '0x8794e371f6e14027a4cd5434f2cf93cab35524d26f77a1abea3325821c6dfeff'
	})

	it('it properly hashes from string', async () => {
		const buf = await fs.readFile('./test.mp4')
		const hash = sha256FromBuf(buf)
		expect(sha256FromBuf(buf)).to.equal(Hash)
	})
})
