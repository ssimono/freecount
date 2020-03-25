import { decrypt, encrypt } from '../js/lib.js'

export default function testCrypto () {
  test('does a stable crypt / decrypt loop', () => {
    const key = [43, 184, 13, 83, 123, 29, 163, 227, 139, 211, 3, 97, 170, 133, 86, 134, 189, 224, 234, 205, 113, 98, 254, 246, 162, 95, 233, 123, 245, 39, 162, 91]
    const message = 'Eum et modi ratione totam sed officiis eaque tenetur. Perspiciatis tempore ipsa et laborum tempore incidunt et. Porro soluta eos nam sunt perferendis molestiae nulla est. Nobis incidunt dolore et sequi e'

    const encrypted = encrypt(key, message)
    const decrypted = decrypt(key, encrypted)

    assert.equal(message, decrypted)
    assert.notEqual(message, encrypted)
  })
}
