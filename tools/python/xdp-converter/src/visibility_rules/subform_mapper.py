import xml.etree.ElementTree as ET


def map_subforms(root: ET):
    subform_map = {}
    for elem in root.iter():
        if elem.tag == "subform":
            name = elem.attrib.get("name")
            if name:
                subform_map[name] = elem
    return subform_map
