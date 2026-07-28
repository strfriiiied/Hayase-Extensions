export default new class Nyaa {
  base = 'https://nyaa.si/?page=rss'

  /** @type {import('./').SearchFunction} */
  async single ({ titles, episode, fetch }) {
    if (!titles?.length) return []

    const query = this.buildQuery(titles[0], episode)
    const url = `${this.base}&q=${encodeURIComponent(query)}`

    const res = await fetch(url)
    const text = await res.text()

    return this.parseRSS(text)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single
  movie = this.single

  buildQuery (title, episode) {
    let query = title.replace(/[^\w\s-]/g, ' ').trim()
    if (episode) query += ` ${episode.toString().padStart(2, '0')}`
    return query
  }

  parseRSS (text) {
    const results = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g

    let match
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1]

      const title = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1]
      const link = item.match(/<link>(.*?)<\/link>/)?.[1]
      const hash = item.match(/<nyaa:infoHash>(.*?)<\/nyaa:infoHash>/)?.[1]
      if (!title || !link || !hash) continue

      const seeders = item.match(/<nyaa:seeders>(.*?)<\/nyaa:seeders>/)?.[1]
      const leechers = item.match(/<nyaa:leechers>(.*?)<\/nyaa:leechers>/)?.[1]
      const downloads = item.match(/<nyaa:downloads>(.*?)<\/nyaa:downloads>/)?.[1]
      const size = item.match(/<nyaa:size>(.*?)<\/nyaa:size>/)?.[1]
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]

      results.push({
        title,
        link,
        hash,
        seeders: parseInt(seeders || '0'),
        leechers: parseInt(leechers || '0'),
        downloads: parseInt(downloads || '0'),
        size: this.parseSize(size || ''),
        date: pubDate ? new Date(pubDate) : new Date(),
        type: 'alt',
        accuracy: 'medium'
      })
    }
    return results
  }

  parseSize (sizeStr) {
    const match = sizeStr.match(/([\d.]+)\s*(KiB|MiB|GiB|KB|MB|GB)/i)
    if (!match) return 0

    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()

    switch (unit) {
      case 'KIB':
      case 'KB': return value * 1024
      case 'MIB':
      case 'MB': return value * 1024 * 1024
      case 'GIB':
      case 'GB': return value * 1024 * 1024 * 1024
      default: return 0
    }
  }

  async test () {
    try {
      const res = await fetch(this.base + '&q=one+piece')
      return res.ok
    } catch {
      return false
    }
  }
}()
