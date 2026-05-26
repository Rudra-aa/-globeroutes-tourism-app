import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """function createCityCard(city, rank, showGlobalRank) {
  const isTop = showGlobalRank && rank === 1;
  const tierColor = city._topTier ? `var(--tier-${city._topTier})` : 'var(--text-secondary)';
  const tierGlow  = city._topTier ? `0 0 8px var(--tier-${city._topTier})` : 'none';

  const rankBadge = isTop
    ? `<span style="font-size:0.65rem;font-weight:800;color:#ffd700;background:rgba(255,215,0,0.15);border:1px solid rgba(255,215,0,0.4);border-radius:20px;padding:2px 7px;white-space:nowrap;">\U0001F451 TOP</span>`
    : (showGlobalRank ? `<span style="font-size:0.65rem;font-weight:700;color:var(--text-secondary);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:2px 6px;">#${rank}</span>` : '');

  const poiPill = city._poiCount > 0
    ? `<span style="font-size:0.62rem;color:${tierColor};font-weight:600;">${city._poiCount} place${city._poiCount > 1 ? 's' : ''}</span>`
    : `<span style="font-size:0.62rem;color:var(--text-secondary);">Explorable</span>`;

  const tierDot = city._topTier
    ? `<span style="width:7px;height:7px;border-radius:50%;background:${tierColor};box-shadow:${tierGlow};display:inline-block;flex-shrink:0;"></span>`
    : '';

  const coverImg = city.coverImage || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=150&q=80';
  const stateTag = city.state ? `<span style="font-size:0.62rem;color:rgba(255,255,255,0.4);">${city.state}</span>` : '';

  const el = document.createElement('div');
  el.className = 'city-card';
  if (isTop) el.style.cssText = 'border: 1px solid rgba(255,215,0,0.25); background: rgba(255,215,0,0.04);';

  el.innerHTML = `
    <div class="city-thumbnail" style="background-image:url('${coverImg}');flex-shrink:0;"></div>
    <div style="flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px;">
        ${rankBadge}
        <h4 style="font-size:0.92rem;font-weight:700;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${city.name}</h4>
      </div>
      <p style="font-size:0.72rem;color:var(--text-secondary);margin:0 0 3px 0;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${city.tagline || ''}</p>
      <div style="display:flex;align-items:center;gap:6px;">
        ${tierDot}
        ${poiPill}
        ${stateTag}
      </div>
    </div>
    <i data-lucide="chevron-right" style="width:15px;color:var(--text-secondary);flex-shrink:0;"></i>
  `;
  el.onclick = () => navigateCity(city.id);
  return el;
}"""

pattern = re.compile(r'function createCityCard\(city, rank, showGlobalRank\) \{.*?\n\}', re.DOTALL)
match = pattern.search(content)
if match:
    content = content[:match.start()] + new_func + content[match.end():]
    print("createCityCard patched successfully")
else:
    print("ERROR: Could not find createCityCard function")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js saved")
