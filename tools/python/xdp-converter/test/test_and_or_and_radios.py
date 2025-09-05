def test_and_condition_turns_into_allof(run_pipeline):
    xdp = r"""
    <subform name="Root">
      <field name="a"><ui><checkButton shape="square"/></ui></field>
      <field name="b"><ui><checkButton shape="square"/></ui></field>
      <subform name="Target" presence="visible"/>
      <event activity="change">
        <script contentType="application/x-javascript">
          if (a.rawValue == 1 && b.rawValue == 1) { Target.presence = "hidden"; }
        </script>
      </event>
    </subform>
    """
    out = run_pipeline(xdp)
    rule = out["Target"]
    assert rule["effect"] == "HIDE"
    cond = rule["condition"]
    assert cond["scope"] == "#"
    all_of = cond["schema"]["allOf"]
    assert len(all_of) == 2
    fields = [list(atom["properties"].keys())[0] for atom in all_of]
    assert set(fields) == {"a", "b"}
    for atom in all_of:
        fld = list(atom["properties"].keys())[0]
        assert atom["properties"][fld]["const"] == 1


def test_exclgroup_radios_collapse_to_enum_field(run_pipeline):
    # Simulate a true radio group with <exclGroup>. When either opt1 or opt2 is selected,
    # show SectionY. Expect this to rewrite to a single string field "Section2" with enum.
    xdp = r"""
    <subform name="Root">
      <exclGroup name="Section2">
        <field name="optStandard">
          <ui><checkButton shape="round"/></ui>
          <caption>Standard</caption>
        </field>
        <field name="optEmergency">
          <ui><checkButton shape="round"/></ui>
          <caption>Emergency</caption>
        </field>
      </exclGroup>

      <subform name="SectionY" presence="hidden"/>
      <event activity="change">
        <script contentType="application/x-javascript">
          if (optStandard.rawValue == 1 || optEmergency.rawValue == 1) {
            SectionY.presence = "visible";
          }
        </script>
      </event>
    </subform>
    """
    out = run_pipeline(xdp)

    # Baseline hidden → we should keep only SHOW rules.
    rule = out["SectionY"]
    assert rule["effect"] == "SHOW"
    cond = rule["condition"]
    assert cond["scope"] == "#"

    # OR of two radio options from the same group becomes enum on the GROUP, not on the member fields
    schema = cond["schema"]
    # Could be anyOf with a single properties+enum atom OR directly {properties:{Section2:{enum:[...]}}}
    # We normalize both possibilities:
    if "anyOf" in schema:
        # then it should have exactly one properties/enum entry
        assert len(schema["anyOf"]) == 1
        enum_atom = schema["anyOf"][0]
        assert "properties" in enum_atom
        assert "Section2" in enum_atom["properties"]
        assert set(enum_atom["properties"]["Section2"]["enum"]) == {
            "Standard",
            "Emergency",
        }
    else:
        # direct atom style
        assert "properties" in schema
        assert "Section2" in schema["properties"]
        assert set(schema["properties"]["Section2"]["enum"]) == {
            "Standard",
            "Emergency",
        }
