import { decrypt, encrypt, sha256 } from '../js/lib.js'

export default function testCrypto () {
  test('computes the sha256 sum of a string', () => {
    const testCases = [
      ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
      ['hello', '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'],
      ['weird ¢ĥåRáĉters ☺', 'e3b4bfcf90bb466e8a157362ecca7a751e9eda2c5ce1e939b1eefab0f28bd452'],
      ['\nnew line', '863b8ef960af9b875b7b455669fcd94bb44042302dd9369eb57e9e1b6439016b']
    ]

    const jobs = testCases.map(([msg, _]) => sha256(msg))
    return Promise.all(jobs).then(results => {
      const expected = testCases.map(([_, e]) => e)
      assert.deepEqual(results, expected)
    })
  })

  test('does a stable crypt / decrypt loop', () => {
    const key = [43, 184, 13, 83, 123, 29, 163, 227, 139, 211, 3, 97, 170, 133, 86, 134, 189, 224, 234, 205, 113, 98, 254, 246, 162, 95, 233, 123, 245, 39, 162, 91]
    const message = 'Eum et modi ratione totam sed officiis eaque tenetur. Perspiciatis tempore ipsa et laborum tempore incidunt et. Porro soluta eos nam sunt perferendis molestiae nulla est. Nobis incidunt dolore et sequi e'

    const encrypted = encrypt(key, message)
    const decrypted = decrypt(key, encrypted)

    assert.equal(message, decrypted)
    assert.notEqual(message, encrypted)
  })
}
