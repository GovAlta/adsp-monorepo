def test_unconditional_hide_becomes_baseline_and_is_dropped(run_pipeline):
    xdp = r"""
    <subform name="Root">
      <subform name="TargetA" presence="visible"/>
      <event activity="initialize">
        <script contentType="application/x-javascript">
          // unconditional hide (outside if/else)
          TargetA.presence = "hidden";
        </script>
      </event>
    </subform>
    """
    out = run_pipeline(xdp)
    # Unconditional 'hidden' should be folded into baseline and produce no rule
    assert "TargetA" not in out


def test_many_hide_rules_merge_to_anyof(run_pipeline):
    xdp = r"""
    <subform name="Root">
      <field name="chkA"><ui><checkButton shape="square"/></ui></field>
      <field name="chkB"><ui><checkButton shape="square"/></ui></field>
      <subform name="SectionX" presence="visible"/>
      <event activity="change">
        <script contentType="application/x-javascript">
          if (chkA.rawValue == 1) { SectionX.presence = "hidden"; }
          if (chkB.rawValue == 1) { SectionX.presence = "hidden"; }
        </script>
      </event>
    </subform>
    """
    out = run_pipeline(xdp)
    # Expect ONE rule with effect HIDE, scope "#", schema.anyOf for chkA/chkB == 1
    rule = out["SectionX"]
    assert rule["effect"] == "HIDE"
    cond = rule["condition"]
    assert cond["scope"] == "#"
    any_of = cond["schema"]["anyOf"]
    # check two atoms present
    props = [list(atom["properties"].keys())[0] for atom in any_of]
    assert set(props) == {"chkA", "chkB"}
    # values are const 1
    for atom in any_of:
        field = list(atom["properties"].keys())[0]
        assert atom["properties"][field]["const"] == 1
