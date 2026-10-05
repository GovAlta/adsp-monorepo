-- Returns the current state of a planning poker session for people who join or reconnect.
-- Runner roles: default-roles-<realm> (every tenant user). Runs with the script service account.
-- Inputs: sessionId
-- Output: JSON string { sessionId, participants, round, votes, history }.
--
-- While a round is open, votes only list who has voted. Vote values are returned only after reveal.

local NAMESPACE = 'planning-poker'
local MAX_ID_LENGTH = 64
local MAX_ROUND_ENTRIES = 100
local MAX_PARTICIPANT_ENTRIES = 200
local MAX_VOTE_ENTRIES = 200

-- Script inputs arrive as a .NET dictionary; check the key first so a missing input reads as nil.
local function readInput(name, maxLength)
  if not inputs:ContainsKey(name) or inputs[name] == nil then
    return nil
  end
  local value = tostring(inputs[name])
  if string.len(value) > maxLength then
    error(name .. ' must be ' .. maxLength .. ' characters or less.')
  end
  return value
end

local function requireInput(name, maxLength)
  local value = readInput(name, maxLength)
  if value == nil or value == '' then
    error(name .. ' is required.')
  end
  return value
end

-- Values read back from the value service are .NET dictionaries and lists, not Lua tables.
local function field(dictionary, key)
  if dictionary == nil or not dictionary:ContainsKey(key) then
    return nil
  end
  local value = dictionary[key]
  -- Stored strings that look like dates are parsed into .NET DateTime on read; return them as ISO text.
  if type(value) == 'userdata' and value:GetType().Name == 'DateTime' then
    return value:ToString('o')
  end
  return value
end

-- Returns the stored values of a series as a Lua array, newest first.
local function readValues(name, top)
  local entries = field(field(adsp.ReadValue(NAMESPACE, name, top), NAMESPACE), name)
  local values = {}
  if entries ~= nil then
    for index = 0, entries.Count - 1 do
      table.insert(values, field(entries[index], 'value'))
    end
  end
  return values
end

-- Keeps the newest entry per user (values come back newest first) with only the requested fields.
local function latestByUser(entries, fields)
  local byUser = {}
  for _, entry in ipairs(entries) do
    local userId = field(entry, 'userId')
    if userId ~= nil and byUser[userId] == nil then
      local item = {}
      for _, name in ipairs(fields) do
        item[name] = field(entry, name)
      end
      byUser[userId] = item
    end
  end
  return byUser
end

local function toRound(entry)
  return {
    roundId = field(entry, 'roundId'),
    storyTitle = field(entry, 'storyTitle'),
    storyUrl = field(entry, 'storyUrl') or '',
    status = field(entry, 'status'),
    average = field(entry, 'average'),
    hasAverage = field(entry, 'hasAverage'),
    consensus = field(entry, 'consensus'),
  }
end

local function collectHistory(roundEntries)
  local history, seen = {}, {}
  for _, entry in ipairs(roundEntries) do
    local roundId = field(entry, 'roundId')
    if field(entry, 'status') == 'revealed' and not seen[roundId] then
      seen[roundId] = true
      table.insert(history, toRound(entry))
    end
  end
  return history
end

local function encodeString(value)
  local replacements = { ['"'] = '\\"', ['\\'] = '\\\\', ['\n'] = '\\n', ['\r'] = '\\r', ['\t'] = '\\t' }
  local escaped = string.gsub(value, '[%c"\\]', function(character)
    return replacements[character] or string.format('\\u%04x', string.byte(character))
  end)
  return '"' .. escaped .. '"'
end

-- Minimal JSON encoder since the sandbox has no JSON library; tables with array items encode as arrays.
-- A table with a rawJson field is emitted as-is (used for the stored votes snapshot).
local function encodeJson(value)
  local valueType = type(value)
  if valueType == 'string' or valueType == 'userdata' then
    return encodeString(tostring(value))
  elseif valueType == 'number' or valueType == 'boolean' then
    return tostring(value)
  elseif valueType ~= 'table' then
    return 'null'
  elseif value.rawJson ~= nil then
    return value.rawJson
  end

  local encoded, separator = '', ''
  if #value > 0 then
    for _, item in ipairs(value) do
      encoded = encoded .. separator .. encodeJson(item)
      separator = ','
    end
    return '[' .. encoded .. ']'
  end
  for key, item in pairs(value) do
    encoded = encoded .. separator .. encodeString(tostring(key)) .. ':' .. encodeJson(item)
    separator = ','
  end
  return '{' .. encoded .. '}'
end

local sessionId = requireInput('sessionId', MAX_ID_LENGTH)
local roundEntries = readValues('round-' .. sessionId, MAX_ROUND_ENTRIES)
local participants = readValues('participants-' .. sessionId, MAX_PARTICIPANT_ENTRIES)

local state = {
  sessionId = sessionId,
  participants = latestByUser(participants, { 'userName' }),
  history = collectHistory(roundEntries),
  votes = {},
}

local current = roundEntries[1]
if current ~= nil then
  state.round = toRound(current)
  if state.round.status == 'revealed' then
    state.votes = { rawJson = field(current, 'votesJson') or '{}' }
  else
    local votes = readValues('votes-' .. state.round.roundId, MAX_VOTE_ENTRIES)
    state.votes = latestByUser(votes, { 'userName' })
  end
end

return encodeJson(state)
