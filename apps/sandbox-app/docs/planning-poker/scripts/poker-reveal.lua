-- Reveals all votes in the current round and closes it for voting.
-- Runner roles: default-roles-<realm> (every tenant user). Runs with the script service account.
-- Inputs: sessionId, roundId
-- Output: JSON string of the revealed round.
--
-- Only votes from players still at the table count. Revealing an already revealed round returns the
-- stored result, because every board auto-reveals once everyone has voted.

local NAMESPACE = 'planning-poker'
local MAX_ID_LENGTH = 64
local MAX_VOTE_ENTRIES = 200
local MAX_PARTICIPANT_ENTRIES = 200
-- Keep in step with POKER_PRESENCE_TIMEOUT_MS in the sandbox app and poker-get-state.
local PRESENCE_TIMEOUT_SECONDS = 90

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

local function sendEvent(name, sessionId, payload)
  if not adsp.SendDomainEvent(NAMESPACE, name, sessionId, { sessionId = sessionId }, payload) then
    error('Failed to send ' .. name .. ' event.')
  end
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

-- A player has dropped when their newest entry is a leave, or their last heartbeat is too old.
local function readActivePlayers(sessionId, now)
  local active, seen = {}, {}
  for _, entry in ipairs(readValues('participants-' .. sessionId, MAX_PARTICIPANT_ENTRIES)) do
    local userId = field(entry, 'userId')
    if userId ~= nil and not seen[userId] then
      seen[userId] = true
      local seenAt = tonumber(field(entry, 'seenAt'))
      active[userId] = field(entry, 'active') == true and seenAt ~= nil and now - seenAt <= PRESENCE_TIMEOUT_SECONDS
    end
  end
  return active
end

-- Values come back newest first, so the first entry seen for a user is their latest vote.
local function readLatestVotes(roundId, players)
  local votes = {}
  for _, entry in ipairs(readValues('votes-' .. roundId, MAX_VOTE_ENTRIES)) do
    local userId = field(entry, 'userId')
    if userId ~= nil and players[userId] and votes[userId] == nil then
      votes[userId] = { userName = field(entry, 'userName'), vote = field(entry, 'vote') }
    end
  end
  return votes
end

-- Average covers numeric cards only; '?' and 'coffee' are excluded but still break consensus.
local function summarizeVotes(votes)
  local total, numericCount, firstVote, consensus = 0, 0, nil, true
  for _, ballot in pairs(votes) do
    local points = tonumber(ballot.vote)
    if points ~= nil then
      total = total + points
      numericCount = numericCount + 1
    end
    if firstVote == nil then
      firstVote = ballot.vote
    elseif firstVote ~= ballot.vote then
      consensus = false
    end
  end

  local average = 0
  if numericCount > 0 then
    average = math.floor(total / numericCount * 10 + 0.5) / 10
  end
  return { average = average, hasAverage = numericCount > 0, consensus = firstVote ~= nil and consensus }
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
local roundId = requireInput('roundId', MAX_ID_LENGTH)

local round = readValues('round-' .. sessionId, 1)[1]
if field(round, 'roundId') ~= roundId then
  error('Round ' .. roundId .. ' is not open for voting.')
end

if field(round, 'status') == 'revealed' then
  return encodeJson({
    sessionId = sessionId,
    roundId = roundId,
    storyTitle = field(round, 'storyTitle'),
    storyUrl = field(round, 'storyUrl') or '',
    status = 'revealed',
    average = field(round, 'average'),
    hasAverage = field(round, 'hasAverage'),
    consensus = field(round, 'consensus'),
    votes = { rawJson = field(round, 'votesJson') or '{}' },
  })
end

local votes = readLatestVotes(roundId, readActivePlayers(sessionId, os.time()))
local summary = summarizeVotes(votes)
local revealed = {
  sessionId = sessionId,
  roundId = roundId,
  storyTitle = field(round, 'storyTitle'),
  storyUrl = field(round, 'storyUrl') or '',
  status = 'revealed',
  average = summary.average,
  hasAverage = summary.hasAverage,
  consensus = summary.consensus,
}

-- The votes snapshot is stored as JSON so poker-get-state can return exactly what was revealed.
local snapshot = {}
for key, item in pairs(revealed) do
  snapshot[key] = item
end
snapshot.votesJson = encodeJson(votes)

adsp.WriteValue(NAMESPACE, 'round-' .. sessionId, {
  value = snapshot,
  context = { sessionId = sessionId },
  correlationId = roundId,
})

revealed.votes = votes
sendEvent('votes-revealed', sessionId, revealed)

return encodeJson(revealed)
